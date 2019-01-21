'use strict';

let expect = require('chai').expect;

let grpcc = require('../lib');

describe('grpcc', () => {
  it('should throw to parse non-existent proto file', () => {
    let args = {
      proto: '/path/to/nowhere',
      address: ':8080',
      eval: '1',
    };
    let fn = grpcc.bind(null, args, {});
    expect(fn).to.throw(/property/);
  });

  // TODO: update/remove, temporary won't throw exception as it wait before
  // it('should throw if non-existing service name', () => {
  //   let fn = grpcc.bind(null, './test/test.proto', undefined, 'MyService');
  //   expect(fn).to.throw(/unable to locate/i);
  // });

  it('should throw if address is not provided', () => {
    let args = {
      proto: './test/test.proto',
      service: 'TestService',
      eval: '1',
    };
    let fn = grpcc.bind(null, args, {});
    expect(fn).to.throw(/address should be valid/i);
  });

  it('should find default service name', () => {
    let args = {
      proto: './test/test.proto',
      address: ':8080',
      eval: '1',
    };

    let fn = grpcc.bind(null, args, {});
    expect(fn).to.not.throw(/unable to locate/i);
  });

  it('should cleanly exit on no service', () => {
    let args = {
      proto: './test/noservicenested.proto',
      address: ':8080',
      eval: '1',
    };

    let fn = grpcc.bind(null, args, {});
    expect(fn).to.not.throw(/unable to locate/i);
  });

  it('should find service name in nested package', () => {
    let args = {
      proto: './test/nestedtest.proto',
      address: ':8080',
      eval: '1',
    };

    let fn = grpcc.bind(null, args, {});
    expect(fn).to.not.throw(/unable to locate/i);
  });

  it('should support missing package name', () => {
    let args = {
      proto: './test/nopackage.proto',
      address: ':8080',
      eval: '1',
    };

    let fn = grpcc.bind(null, args, {});
    expect(fn).to.not.throw(/unable to locate/i);
  });

  it('should fail if non existent exec script is loaded', () => {
    let args = {
      proto: './test/nopackage.proto',
      address: ':8080',
      exec: './no/such/file',
    };

    let fn = grpcc.bind(null, args, {});
    expect(fn).to.throw(/no such file/i);
  });

  it('should fail if bad exec script is loaded', () => {
    let args = {
      proto: './test/nopackage.proto',
      address: ':8080',
      exec: './test/badexec/badexec.js',
    };

    let fn = grpcc.bind(null, args, {});
    expect(fn).to.throw(/unexpected identifier/i);
  });
});
