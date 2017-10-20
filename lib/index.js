'use strict';

require('colors');
require('events').prototype.inspect = () => {return 'EventEmitter {}';};

let fs = require('fs');
let grpc = require('grpc');
let fmt = require('util').format;
let repl = require('repl');
let inquirer = require('inquirer');
let _eval = require('eval');
let vm = require('vm');

function createClient(args, options) {
  if (!args.address) {
    throw new Error("Address should be valid");
  }

  let file = {
    root: (args.directory) ? args.directory : process.cwd(),
    file: args.proto
  };
  let parsed = args.parsed = grpc.load(file);
  let packages = Object.keys(JSON.parse(JSON.stringify(parsed)));
  if (packages.length === 1) {
    return init(packages[0], args, options);
  } else {
    inquirer.prompt([{
      type: 'list',
      name: 'packageName',
      message: 'What package you want to use?',
      choices: packages
    }]).then(function(answers) {
      init(answers.packageName, args, options);
    }).catch(err => {
        console.error(err);
    });
  }
}

// Recursively search a parsed protos definition for the first service
function findService(def){
  let keys = Object.keys(def);
  for(let i=0; i < keys.length; i++){
    let propName = keys[i]
    let propValue = def[propName];

    if(typeof propValue === 'object'){
      let res = findService(propValue);
      if(res){
        return res;
      }
    }else if(propValue.service){
      return {name: propName, ctr: propValue};
    }
  }
}

function init(packageName, args, options) {
  let parsed = args.parsed;
  let protoFile = args.proto;
  let serviceName = args.service;
  let address = args.address;
  let ev = loadEval(args);

  let pkg = packageName;
  let def = pkg.split('.').reduce((acc, key) => {
    return acc[key]
  }, parsed)

  // Some protos don't have services defined at all
  if (typeof def === 'function') {
    pkg = protoFile.split('/').slice(-1)[0];
    def = parsed;
  }

  if (!def) {
    throw new Error(fmt("Unable to find a package in %s", protoFile));
  }

  let serviceCtr; //service constructor

  // If a serviceName was provided, select that service from the definitions
  // TODO: Support recursively searching for service name
  if (serviceName) {
    serviceCtr = def[serviceName];
    if(!serviceCtr || !serviceCtr.service){
      throw new Error(fmt('Unable to locate service %s in %s', serviceName, protoFile));
    }
  }else{
    // Find the first service and use it
    let res = findService(def);
    if(!res){
      throw new Error(fmt("Unable to locate any service in %s", protoFile));
    }
    serviceName = res.name;
    serviceCtr = res.ctr;
  }

  let creds = createCredentials(options);
  let client = new serviceCtr(address, creds);

  function loadVars(table, displayPrompt, newLine) {
    table.grpc = grpc;
    table.client = client;
    table.printReply = printReply.bind(null, displayPrompt, newLine);
    table.pr = table.printReply;
    table.streamReply = streamReply.bind(null, displayPrompt, newLine);
    table.sr = table.streamReply;
    table.createMetadata = createMetadata;
    table.cm = createMetadata;
  }

  if (ev && ev.length > 0) {
    let scope = {};
    loadGlobals(scope);
    loadVars(scope, ()=>{}, ()=>{});
    new vm.Script(ev); // We only use this to get nice compile errors
    _eval(ev, scope);

  } else {
    printUsage(pkg, serviceName, address, serviceCtr.service);
    console.log("");

    let replOpts = {
      prompt: getPrompt(serviceName, address),
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
  console.log("\nConnecting to %s on %s. Available globals:\n", serviceName, address);

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
}

function getPrompt(serviceName, address) {
  return serviceName.blue + '@' + address + '> ';
}

function printReply(displayPrompt, newLine, err, reply) {
  newLine();
  if (err) {
    console.log("Error: ".red, err);
  } else {
    console.log(JSON.stringify(reply, false, '  '));
    displayPrompt();
  }
}

function streamReply(displayPrompt, newLine, reply) {
  newLine();
  console.log(JSON.stringify(reply, false, '  '));
  displayPrompt();
}

module.exports = createClient;
