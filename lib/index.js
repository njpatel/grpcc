'use strict';

require('colors');
require('events').prototype.inspect = () => {return 'EventEmitter {}';};

let fs = require('fs');
let net = require('net');
let grpc = require('grpc');
let loader = require('@grpc/proto-loader');
let fmt = require('util').format;
let repl = require('repl');
let inquirer = require('inquirer');
let _eval = require('eval');
let vm = require('vm');

function createUnixSocketProxy(unixAddr, cb) {
  let server = net.createServer((conn) => {
    let unixConn = net.createConnection(unixAddr);
    unixConn.on('error', () => { conn.end(); });
    conn.pipe(unixConn);
    unixConn.pipe(conn);

    conn.unref();
    unixConn.unref();
  });
  server.listen(0, "localhost", () => {
    server.unref();
    let port = server.address().port;
    console.log('Proxying UNIX socket', unixAddr, 'via port', port);
    cb(null, port);
  });
}

function prepareClient(service, args, options) {
  if (args.address.startsWith('unix:')) {
    createUnixSocketProxy(args.address.substr(5), (err, tcpPort) => {
      if (err) return console.error('Unable to prepare proxy:', err);

      args.address = 'localhost:' + tcpPort;
      init(service, args, options);
    });
    return;
  }

  init(service, args, options);
}

function createClient(args, options) {
  if (!args.address) {
    throw new Error("Address should be valid");
  }

  let file = {
    root: (args.directory) ? args.directory : process.cwd(),
    file: args.proto
  };

  let packageDefinition = loader.loadSync(file.file, {});
  let parsed = grpc.loadPackageDefinition(packageDefinition);

  // It's possible the proto has no `package defined`
  if (foundServiceClient(parsed)) {
    parsed = { 'unknown': parsed };
  }

  let services = [];
  findService(parsed).forEach(def => {
    let desc = {}
    desc.package = def.package;
    desc.name = def.serviceName;
    desc.fqn = `${desc.package}.${desc.name}`;
    desc.def = def.def;
    services.push(desc);
  });

  if (args.service) {
    let matcher = new RegExp(args.service, 'i');
    services = services.filter(s => matcher.test(s.name) || matcher.test(s.fqn))
  }

  if (services.length === 0) {
    console.error('Unable to find any service in proto file');
  } else if (services.length === 1) {
    return prepareClient(services[0], args, options);
  } else {
    inquirer.prompt([{
      type: 'list',
      name: 'service',
      message: 'What service would you like to connect to?',
      choices: services.map(s => s.fqn),
    }]).then(function(answers) {
      let service = services.find(s => s.fqn === answers.service);
      prepareClient(service, args, options);
    }).catch(err => {
        console.error(err);
    });
  }
}

// Only check top-level properties for a service
function foundServiceClient(obj) {
  return Object.keys(obj).some(key => obj[key].service) > 0;
}

// Recursively search a parsed protos definition for the first service
function findService(def, n){
  let keys = Object.keys(def);
  let found = [];
  let m = n || 0;

  if (m > 5) return [];

  for(let i=0; i < keys.length; i++){
    let propName = keys[i]
    let propValue = def[propName];

    if(typeof propValue === 'object'){
      findService(propValue, m++).forEach(res => {
        res.package = `${propName}${res.package ? '.' + res.package : ''}`;
        found.push(res);
      });
    } else if(propValue.service){
      found.push({serviceName: propName, def: propValue});
    }
  }

  return found;
}

function init(service, args, options) {
  let address = args.address;
  let ev = loadEval(args);
  let creds = createCredentials(options);
  let client = new service.def(address, creds);

  function loadVars(table, displayPrompt, newLine) {
    table.grpc = grpc;
    table.client = client;
    table.printReply = printReply.bind(null, displayPrompt, newLine);
    table.pr = table.printReply;
    table.streamReply = streamReply.bind(null, displayPrompt, newLine);
    table.sr = table.streamReply;
    table.createMetadata = createMetadata;
    table.cm = createMetadata;
    table.printMetadata = printMetadata.bind(null, displayPrompt, newLine);
    table.pm = table.printMetadata;
  }

  if (ev && ev.length > 0) {
    let scope = {};
    loadGlobals(scope);
    loadVars(scope, ()=>{}, ()=>{});
    new vm.Script(ev, { displayErrors: true }); // We only use this to get nice compile errors
    _eval(ev, scope);

  } else {
    printUsage(service.package, service.name, address, service.def.service);
    console.log("");

    let replOpts = {
      prompt: getPrompt(service.name, address),
      ignoreUndefined: true,
      replMode: repl.REPL_MODE_MAGIC,
    };
    let rs = repl.start(replOpts);
    loadVars(rs.context, rs.displayPrompt.bind(rs), console.log);
  }
}

function loadEval(args) {
  if (args.eval) {
    return args.eval;
  } else if (args.exec) {
    return fs.readFileSync(args.exec);
  } else {
    return undefined;
  }
}

function loadGlobals(ctx) {
  for (let prop in global) {
    ctx[prop] = global[prop];
  }
}

function createCredentials(options) {
  if (options.insecure) {
    return grpc.credentials.createInsecure();
  }

  if (!options.rootCert) {
    return grpc.credentials.createSsl();
  }

  let rootCert = undefined;
  let privateKey = undefined;
  let certChain = undefined;

  try {
    if (options.rootCert) {
      rootCert = fs.readFileSync(options.rootCert);
    }

    if (options.privateKey) {
      privateKey = fs.readFileSync(options.privateKey);
    }

    if (options.certChain) {
      certChain = fs.readFileSync(options.certChain);
    }

  } catch(e) {
    console.error('Unable to load custom SSL certs: ' + e);
    process.exit(1);
  }

  return grpc.credentials.createSsl(rootCert, privateKey, certChain);
}

function createMetadata(metadata) {
  if (metadata instanceof grpc.Metadata) {
    return metadata
  }

  var meta = new grpc.Metadata();
  for(var k in metadata){
    var v = metadata[k];
    if(typeof v !== 'string'){
      v = v.toString();
    }
    meta.add(k, v);
  }
  return meta;
}

function printUsage(pkg, serviceName, address, service) {
  console.log("\nConnecting to %s.%s on %s. Available globals:\n", pkg, serviceName, address);

  console.log('  ' + 'client'.red + ' - the client connection to %s', serviceName);
  Object.keys(service).map(name => {
    console.log('    %s (%s, callback) %s %s', name.green,
      service[name].requestType.name,
      "returns".gray,
      service[name].responseType.name);
  });
  console.log();

  function printCmd(cmd, desc, alias) {
    console.log('  ' + cmd.red + ' - ' + desc + ' (alias: ' + alias.red + ')');
  }

  printCmd('printReply', 'function to easily print a unary call reply', 'pr');
  printCmd('streamReply', 'function to easily print stream call replies', 'sr');
  printCmd('createMetadata', 'convert JS objects into grpc metadata instances', 'cm');
  printCmd('printMetadata', "function to easily print a unary call's metadata", 'pm');
}

function getPrompt(serviceName, address) {
  return serviceName.blue + '@' + address + '> ';
}

function printReply(displayPrompt, newLine, err, reply) {
  newLine();
  if (err) {
    if (err.metadata) {
      err.metadata = err.metadata.getMap();
    }

    console.log("Error: ".red, err);
  } else {
    console.log(JSON.stringify(reply, false, '  '));
    displayPrompt();
  }
}

function printMetadata(displayPrompt, newLine, metadata) {
  newLine();
  let obj = {
    Metadata: metadata.getMap()
  }
  console.log(JSON.stringify(obj, false, '  '));
  displayPrompt();
}

function streamReply(displayPrompt, newLine, reply) {
  newLine();
  console.log(JSON.stringify(reply, false, '  '));
  displayPrompt();
}

module.exports = createClient;
