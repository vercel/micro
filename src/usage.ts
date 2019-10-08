export default function usage() {
	console.error(`
  micri - Asynchronous HTTP microservices

  USAGE

      $ micri --help
      $ micri --version
      $ micri [-l listen_uri [-l ...]] [entry_point.js]

      By default micri will listen on 0.0.0.0:3000 and will look first
      for the "main" property in package.json and subsequently for index.js
      as the default entry_point.

      Specifying a single --listen argument will overwrite the default, not supplement it.

  OPTIONS

      --help                              shows this help message

      -v, --version                       displays the current version of micri

      -l, --listen listen_uri             specify a URI endpoint on which to listen (see below) -
                                          more than one may be specified to listen in multiple places

  ENDPOINTS

      Listen endpoints (specified by the --listen or -l options above) instruct micri
      to listen on one or more interfaces/ports, UNIX domain sockets, or Windows named pipes.

      For TCP (traditional host/port) endpoints:

          $ micri -l tcp://hostname:1234

      For UNIX domain socket endpoints:

          $ micri -l unix:/path/to/socket.sock

      For Windows named pipe endpoints:

          $ micri -l pipe:\\\\.\\pipe\\PipeName
`);
	process.exit(2);
}
