#!/usr/bin/env node --harmony

'use strict';

let program = require('commander');

let grpcc = require('../lib');

program
  .version("0.0.1")
	.option('-p, --proto <path>', 'path to a protobuf file describing the service (required)')
	.option('-a, --address <host:port>', 'the address of the service to connect to (required)')
	.option('-s, --service <name>', 'the name of the service to connect to (optional)')
  .option('-i, --insecure', 'use an insecure connection (default=false)', false)
  .parse(process.argv);


if (!program.proto || program.proto.length < 3) {
	console.log('\nError: `proto` should be a valid path to a .proto file');
	program.help();
}

if (!program.address || program.address.indexOf(':') < 0) {
	console.log('\nError: `address` should be in the form of host:port, e.g. 127.0.0.1:6353');
	program.help();
}

grpcc(program.proto, program.service, program.address, { insecure: program.insecure });
