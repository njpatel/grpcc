#!/usr/bin/env node

'use strict';

let program = require('commander');

let grpcc = require('../lib');

program
  .version(require('../package.json').version)
  .option('-p, --proto <path>', 'path to a protobuf file describing the service (required)')
  .option('-d, --directory <path>', 'path to a protobuf file directory')
  .option('-a, --address <host:port>', 'the address of the service to connect to (required)')
  .option('-s, --service <name>', 'the name of the service to connect to (optional)')
  .option('-i, --insecure', 'use an insecure connection (default=false)', false)
  .option('--root_cert <path>', 'specify root certificate path for secure connections (optional)')
  .option('--private_key <path>', 'specify private key path for secure connections (optional)')
  .option('--cert_chain <path>', 'specify certificate chain path for secure connections (optional)')
  .parse(process.argv);


if (!program.proto || program.proto.length < 3) {
  console.log('\nError: `proto` should be a valid path to a .proto file');
  program.help();
}

if (!program.address || program.address.indexOf(':') < 0) {
  console.log('\nError: `address` should be in the form of host:port, e.g. 127.0.0.1:6353');
  program.help();
}

try {
  grpcc(program.proto, program.directory, program.service, program.address, {
    insecure: program.insecure,
    rootCert: program.root_cert,
    privateKey: program.private_key,
    certChain: program.cert_chain,
  });
} catch (e) {
  console.error(e);
  process.exit(1);
}
