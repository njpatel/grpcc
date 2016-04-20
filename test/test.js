'use strict';

let expect = require('chai').expect;

let grpcc = require('../lib');

describe('grpcc', () => {
  it('should throw to parse non-existant proto file', () => {
    expect(grpcc.bind(null, '/path/to/nowhere')).to.throw(/read property/);
  });

  it('should throw if non-existing service name', () => {
    let fn = grpcc.bind(null, './test/test.proto', 'MyService');
    expect(fn).to.throw(/unable to locate/i);
  });

  it('should throw if address is not provided', () => {
    let fn = grpcc.bind(null, './test/test.proto', 'TestService');
    expect(fn).to.throw(/address should be valid/i);
  });

  it('should find default service name', () => {
    let fn = grpcc.bind(null, './test/test.proto', undefined, ':8080');
    expect(fn).to.not.throw(/unable to locate/i);
  });

  it('should support missing service name', () => {
    let fn = grpcc.bind(null, './test/noservice.proto', undefined, ':8080');
    expect(fn).to.not.throw(/unable to locate/i);
  });
});
