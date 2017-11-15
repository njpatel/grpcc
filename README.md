# grpcc [![Circle CI](https://circleci.com/gh/njpatel/grpcc.svg?style=svg)](https://circleci.com/gh/njpatel/grpcc)

`grpcc` is a flexible command-line client for any gRPC server for quick and easy testing of APIs. `grpcc` is written in nodejs but can talk to a gRPC service written in any language.

This is an example of using `grpcc` with the [Skizze](https://github.com/skizzehq/skizze) database's gPRC `.proto` file:

<img src="https://njp.ghost.io/content/images/2017/10/grpccv1-2.png" alt="grpcc cli image" width="758" height="841">


### Features
* Easy to create flexible connections to gRPC services for testing
* Supports auto-reconnect via the standard gRPC backoff-retries
* Use Javascript objects to mimic protobuf `Message` objects
* In-built, simple to use pretty-printing callbacks:
  * `printReply` to print unary method call replies
  * `streamReply` to print stream `call.on('data'...` replies
* Support for adding gRPC metadata via `createMetadata`
* Full support for streams (client, server, and bi-directional)
* Flexibilty of a full nodejs environment that can be as simple or complex as required
* **eval** support allows using grpcc like curl, fire off a request and have JSON printed to the console
* **exec** support allows executing pre-existing scripts with results being outputted to stdout
* Connect with ssl, custom ssl certs, or insecurely
* Socket connection support via `--address "unix:/path/to/sockfile`


### Installation

`npm install -g grpcc`


### Getting Started

To use it, you only need the service's `.proto` file, which describes the RPC service, and the address (host:port) of the service. `grpcc` can talk to local or remote services:

```
$ grpcc --proto ./service/myservice.proto --address 127.0.0.1:3466
```

By default, `grpcc` will attempt to make a secure connection to the service. If you need an insecure connection, you can pass in the `-i` flag.

Once `grpcc` has connected, it will print out usage instructions for the configured service. It does this by reading the parsed values from the protobuf file. After printing the instructions, it will start a nodejs REPL with the following globals available:

* `client` - this is the gRPC client connection to your service. The usage instructions will show the available methods, as will using tab completion by typing `client.<tab>`
* `printReply` - a convenience callback for printing the response of an RPC call (nicer than `console.log`) (alias: `pr`)
* `streamReply` - a convenience callback for printing the response of an stream's `'data'` event (nicer than `console.log`) (alias: `cr`)
* `createMetadata` - a convenience function for converting plain javascript objects to gRPC metadata (alias: `cm`)


The REPL environment uses node's [`repl`](https://nodejs.org/api/repl.html) module, so feel free to use any of the in-built features such as save/restore history etc.

#### Arguments, Callbacks, & Streaming

Depending on whether your method is a simple call or a streaming call, you'll have to do different things:

* All calls require an argument matching the spec, so if you have an empty message type in your proto for some calls, you'll be sending in `{}` as the first argument to those calls
* Remember that Protobuf.js will camelCase class and property names
* Unary calls can take a callback as the second argument which has the signature `function(err, reply)`. `reply` will be an object matching the message type as per your proto
* For streaming calls, you'll want to use the `EventEmitter` object that is returned when the call is made and connect to the appropriate events. **Note** the grpc nodejs docs are out of date, check out the examples to see how to work with streams.


### --eval & --exec

The `--eval` and `--exec` options allow running scripts against gRPC servers without the `grpcc` repl being activated. The output of the script is sent to stdout so it's possible to use these modes as part of your own scripts/tests/etc:

**--eval**
```
 $ grpc -i -p foo.proto -a localhost:9090 --eval 'client.getPerson({ id: 1 }, printReply)'
 {
   "name": "Neil Jagdish Patel",
   "location": "London",
   "country": "United Kingdom",
 }
```

**--exec**
```
$ cat myscript.js
var call = client.add({}, pr);
let i = 0;
let id = setInterval(() => {
  if (i > 5) {
    clearInterval(id);
    return call.end();
  }
  i++;
  call.write({ data: i });
}, 100);

$ grpc -i -p foo.proto -a localhost:9090 --exec myscript.js
{
  "sum": 15
}

```


### Examples

There are some example scripts you can run in the [examples](https://github.com/njpatel/grpcc/tree/master/examples) directory. To test them out, do the following:

**Start the example gRPC server**
```
# do this in another terminal tab/window as it has to be running in the background (and will print a lot of information)
$ npm run example-server
```

**Run the example scripts**
```
$ ./bin/grpcc.js --insecure --proto ./test/test.proto --address localhost:8099 --exec ./examples/unary.js
> outputs result of TestService.sayHello()

$ ./bin/grpcc.js -i -p ./test/test.proto -a localhost:8099 -x ./examples/client-stream.js
> script will send 5 'hellos' to server, then end the stream. Server will reply with all five hellos

$ ./bin/grpcc.js -i -p ./test/test.proto -a localhost:8099 -x ./examples/server-stream.js
> script print streamed data from the server until server ends the stream

$ ./bin/grpcc.js -i -p ./test/test.proto -a localhost:8099 -x ./examples/bidirectional-stream.js
> script streams data to server, while server streams data back to client. Either side can end the stream.
```

You can see the server's output in the other terminal. The unary example also shows how to send and receive `metadata`.


### Usage

```
  Usage: grpcc [options]


  Options:

    -V, --version              output the version number
    -p, --proto <path>         path to a protobuf file describing the service (required)
    -d, --directory <path>     path to a protobuf file directory
    -a, --address <host:port>  the address of the service to connect to (required)
    -s, --service <name>       the name of the service to connect to (optional)
    -i, --insecure             use an insecure connection (default=false)
    -e, --eval <string>        evaluate script and print result (optional)
    -x, --exec <path>          execute a script file and print the results (optional)
    --root_cert <path>         specify root certificate path for secure connections (optional)
    --private_key <path>       specify private key path for secure connections (optional)
    --cert_chain <path>        specify certificate chain path for secure connections (optional)
    -h, --help                 output usage information
```



### Todo

Check out the [project](https://github.com/njpatel/grpcc/projects/1)


### License

MIT


### Contact

Neil Jagdish Patel

[Github](https://github.com/njpatel) [Twitter](https://twitter.com/njpatel) [Blog](https://njp.io)
