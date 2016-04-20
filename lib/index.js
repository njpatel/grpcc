'use strict';

require('colors');
require('events').prototype.inspect = () => {return 'EventEmitter {}';};

let grpc = require('grpc');
let fmt = require('util').format;
let util = require('util');
let repl = require('repl');
let inquirer = require('inquirer');

function createClient(protoFile, directory, serviceName, address, options) {
  let file = (directory) ? {root: directory, file: protoFile} : {file: protoFile};
  let parsed = grpc.load(file);

  inquirer.prompt([{
    type: 'list',
    name: 'packageName',
    message: 'What package you want to use?',
    choices: Object.keys(parsed)
  }]).then(function(answers) {
    init(answers.packageName, parsed, protoFile, serviceName, address, options);
  });
}

function init(packageName, parsed, protoFile, serviceName, address, options) {
  let pkg = packageName;
  let def = parsed[pkg];

  // Some protos don't have services defined at all
  if (typeof def === 'function') {
    pkg = protoFile.split('/').slice(-1)[0];
    def = parsed;
  }

  if (!def) {
    throw new Error(fmt("Unable to find a package in %s", protoFile));
  }

  if (!serviceName) {
    // Normally you have one service per proto, but not always the case
    Object.keys(def).forEach(propName => {
      if (def[propName].service) {
        serviceName = propName;
      }
    });
  }
  if (!serviceName || !def[serviceName] || !def[serviceName].service) {
    throw new Error(fmt('Unable to locate service %s in %s', serviceName, protoFile));
  }

  let service = def[serviceName].service;
  if (!address) {
    throw new Error("Address should be valid");
  }

  let creds = options.insecure ? grpc.credentials.createInsecure() : grpc.credentials.createSsl();
  let client = new def[serviceName](address, creds);

  printUsage(pkg, serviceName, address, service);
  console.log("");

  let replOpts = {
    prompt: getPrompt(serviceName, address),
    ignoreUndefined: true,
    replMode: repl.REPL_MODE_MAGIC
  };
  let rs = repl.start(replOpts);
  rs.context.client = client;
  rs.context.printReply = printReply.bind(null, rs);
  rs.context.pr = printReply.bind(null, rs);
}

function printUsage(pkg, serviceName, address, service) {
  console.log("\nConnecting to %s on %s. Available globals:\n", serviceName, address);

  console.log('  ' + 'client'.red + ' - the client connection to %s', serviceName);
  service.children.forEach(child => {
    console.log('    %s (%s, callback) %s %s', (child.name.charAt(0).toLowerCase() + child.name.slice(1)).green,
      child.requestName,
      "returns".gray,
      child.responseName);
  });

  console.log('\n  ' + 'printReply'.red + ' - function to easily print a server reply (alias: %s)', 'pr'.red);
}

function getPrompt(serviceName, address) {
  return serviceName.blue + '@' + address + '> ';
}

function printReply(rs, err, reply) {
  if (err) {
    console.log("Error: ".red, err);
  } else {
    console.log();
    console.log(JSON.stringify(reply, false, '  '));
    rs.displayPrompt();
  }
}


module.exports = createClient;