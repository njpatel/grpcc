# grpcc [![Circle CI](https://circleci.com/gh/njpatel/grpcc.svg?style=svg)](https://circleci.com/gh/njpatel/grpcc)

`grpcc` is a flexible command-line client for any gRPC server for quick and easy testing of APIs.

This is an example of using `grpcc` with the [Skizze](https://github.com/skizzehq/skizze) database's gPRC `.proto` file:

![](https://i.imgur.com/fa1wcaJ.png)


### Features
 * Easy to create flexible connections to gRPC services for testing
 * Supports auto-reconnect via the standard gRPC backoff-retries
 * In-built, simple to use, `printReply` function for handling service replies
 * Use Javascript objects to mimic protobuf `Message` objects
 

### Installation

`npm install -g grpcc`
 
 
### Getting Started

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


### License

MIT
  

### Contact

Neil Jagdish Patel

[Github](https://github.com/njpatel) [Twitter](https://twitter.com/njpatel) [Blog](https://njp.io)
