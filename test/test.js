'use strict';

let expect = require('chai').expect;

let grpcc = require('../lib');

describe('grpcc', () => {
  it('should throw to parse non-existant proto file', () => {
    let args = {
      proto: '/path/to/nowhere',
      address: ':8080',
    };
    expect(grpcc.bind(null, args)).to.throw(/read property/);
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
    };
    let fn = grpcc.bind(null, args);
    expect(fn).to.throw(/address should be valid/i);
  });

  it('should find default service name', () => {
    let args = {
      proto: './test/test.proto',
      address: ':8080',
    };

    let fn = grpcc.bind(null, args);
    expect(fn).to.not.throw(/unable to locate/i);
  });

  it('should find nested service name', () => {
    let args = {
      proto: './test/noservicenested.proto',
      address: ':8080',
    };

    let fn = grpcc.bind(null, args);
    expect(fn).to.throw(/unable to locate/i);
  });

  it('should throw if no service can be found (nested proto)', () => {
    let args = {
      proto: './test/nestedtest.proto',
      address: ':8080',
    };

    let fn = grpcc.bind(null, args);
    expect(fn).to.not.throw(/unable to locate/i);
  });

  it('should support missing service name', () => {
    let args = {
      proto: './test/noservice.proto',
      address: ':8080',
    };

    let fn = grpcc.bind(null, args);
    expect(fn).to.not.throw(/unable to locate/i);
  });
});
