# grpcc [![Circle CI](https://circleci.com/gh/njpatel/grpcc.svg?style=svg)](https://circleci.com/gh/njpatel/grpcc)

`grpcc` is a flexible command-line client for any gRPC server for quick and easy testing of APIs. `grpcc` is writtern in nodejs but can talk to a gRPC service written in any language.

This is an example of using `grpcc` with the [Skizze](https://github.com/skizzehq/skizze) database's gPRC `.proto` file:

![](https://njp.io/content/images/2016/02/Screenshot-2016-02-09-19-22-40.png)


### Features
 * Easy to create flexible connections to gRPC services for testing
 * Supports auto-reconnect via the standard gRPC backoff-retries
 * In-built, simple to use, `printReply` function for handling service replies
 * Use Javascript objects to mimic protobuf `Message` objects
 

### Installation

`npm install -g grpcc`
 
 
### Getting Started

`grpcc` is meant to be used as a quick way to connect to gRPC services to easily execute remote methods. I use it primarily during development, as it allows me to not have to worry about writing client bindings while I'm experiementing with service API.

To use it, you only need the service's `.proto` file, which describes the RPC service, and the address (host:port) of the service. `grpcc` can talk to local or remote services:

```
$ grpcc --proto ./service/myservice.proto --address 127.0.0.1:3466
```

By default, `grpcc` will attempt to make a secure connection to the service. If you need an insecure connection, you can pass in the `-i` flag.

Once `grpcc` has connected, it will print out usage instructions for the configured service. It does this by reading the parsed values from the protobuf file. After printing the instructions, it will start a nodejs REPL with the following globals available:

 * `client` - this is the gRPC client connection to your service. The usage instructions will show the available mehtods, as will using tab completion by typing `client.<tab>`
 * `printReply` - this is a convenience callback for printing the response of an RPC call (nicer than `console.log`)
 * `pr` - this is an alias for `printReply`

The REPL environment is using `--harmony` and detects methods that should have `use strict`, so feel free to use the es6 features that nodejs supports.

#### Arguments, Callbacks, & Streaming

Depending on whether your method is a simple call or a streaming call, you'll have to do different things:

 * All calls require an argument matching the spec, so if you have an empty message type in your proto for some calls, you'll be sending in `{}` as the first argument to those calls
 * Remember that Protobuf.js will camelCase class and property names
 * Simple calls can take a callback as the second argument which has the signature `function(err, reply)`. `reply` will be an object matching the message type as per your proto
 * For streaming calls, you'll want to use the `EventEmitter` object that is returned when the call is made and connect to the appropriate events
 
[The official nodejs gRPC docs](http://www.grpc.io/docs/tutorials/basic/node.html) cover how to use these features very well.


### Usage

```
  Usage: grpcc [options]

  Options:

    -h, --help                 output usage information
    -V, --version              output the version number
    -p, --proto <path>         path to a protobuf file describing the service (required)
    -a, --address <host:port>  the address of the service to connect to (required)
    -s, --service <name>       the name of the service to connect to (optional)
    -i, --insecure             use an insecure connection (default=false)

```


### Todo
 - [ ] Intercept more known error messages from gRPC bindings and pretty-print them
 - [ ] REPL history between sessions
 - [ ] Nicer API for streaming (all types), e.g. a function wrapper that listens to the events and pretty prints
 - [ ] Easily reload the client (when proto changes)


### License

MIT
  

### Contact

Neil Jagdish Patel

[Github](https://github.com/njpatel) [Twitter](https://twitter.com/njpatel) [Blog](https://njp.io)
