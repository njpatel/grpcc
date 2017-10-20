let grpc = require('grpc');
let proto = grpc.load(__dirname+"/test.proto");
let grpcctest = proto.grpcctest;

let server = new grpc.Server();
server.addService(grpcctest.TestService.service, {
  sayHello: function sayHello(call, done) {
    log('sayHello()');
    log('Metadata', call.metadata);
    log('Request', call.request);

    // Send back the same metadata we received
    call.sendMetadata(call.metadata)
    done(null, { saidWhat: call.request.sayWhat });
  },

  sayClientStream: function sayClientStream(call, done) {
    log('sayClientStream()');
    log('Metadata', call.metadata);

    let agg = [];
    call.on('data', function(request) {
      log('Streamed Request', request);
      agg.push(request.sayWhat);
    })

    call.on('end', function() {
      done(null, { saidWhat: agg.join(',') })
    });
  },

  sayServerStream: function sayServerStream(call) {
    log('sayServerStream()');
    log('Metadata', call.metadata);

    let i = 0;
    let id = setInterval(() => {
      if (i > 5) {
        clearInterval(id);
        return call.end();
      }
      i++;
      call.write({ saidWhat:`Hi from server ${i}` });
    }, 100);
  },

  sayBidirectionalStream: function sayBidirectionalStream(call) {
    log('sayBidirectionalStream()');
    log('Metadata', call.metadata);

    call.on('data', function(request) {
      log('Streamed Request', request);
      call.write({ saidWhat: 'server replies ' + request.sayWhat });
    });

    // Limit the connection to 60 seconds
    let id = setTimeout(() => { call.end() }, 60000);
    call.on('end', function() {
      clearTimeout(id);
      call.end();
    });
  },
});

console.log('');
console.log('Starting grpcctest.TestService');
console.log('Run `grpcc -a localhost:8099 -i -p ./test/test.proto` to connect')
console.log('');

server.bind('localhost:8099', grpc.ServerCredentials.createInsecure());
server.start();

function log(what, thing) {
  padding = thing ? '  ' : '';
  console.log(padding+what+':');
  if (thing) {
    console.log(stringify(thing));
    console.log("");
  }
}

function stringify(thing) {
  let shifted = '';
  JSON.stringify(thing, false, '  ').split('\n').forEach((line) => { shifted += '  '+line+'\n' });
  return shifted;
}
