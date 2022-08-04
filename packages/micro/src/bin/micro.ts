#!/usr/bin/env node
/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable no-console */

// Native
import Module from 'module';
import http from 'http';
import path from 'path';
import { existsSync } from 'fs';
// Packages
import arg from 'arg';
// Utilities
import { serve } from '../lib';
import { handle } from '../lib/handler';
import { version } from '../../package.json';
import { logError } from '../lib/error';
import { parseEndpoint } from '../lib/parse-endpoint';
import type { AddressInfo } from 'net';
import type { RequestHandler } from '../lib';

// Check if the user defined any options
const args = arg({
  '--listen': parseEndpoint,
  '-l': '--listen',
  '--help': Boolean,
  '--version': Boolean,
  '-v': '--version',
});

// When `-h` or `--help` are used, print out
// the usage information
if (args['--help']) {
  console.error(`
  micro - Asynchronous HTTP microservices

  USAGE

      $ micro --help
      $ micro --version
      $ micro [-l listen_uri [-l ...]] [entry_point.js]

      By default micro will listen on 0.0.0.0:3000 and will look first
      for the "main" property in package.json and subsequently for index.js
      as the default entry_point.

      Specifying a single --listen argument will overwrite the default, not supplement it.

  OPTIONS

      --help                              shows this help message

      -v, --version                       displays the current version of micro

      -l, --listen listen_uri             specify a URI endpoint on which to listen (see below) -
                                          more than one may be specified to listen in multiple places

  ENDPOINTS

      Listen endpoints (specified by the --listen or -l options above) instruct micro
      to listen on one or more interfaces/ports, UNIX domain sockets, or Windows named pipes.

      For TCP (traditional host/port) endpoints:

          $ micro -l tcp://hostname:1234

      For UNIX domain socket endpoints:

          $ micro -l unix:/path/to/socket.sock

      For Windows named pipe endpoints:

          $ micro -l pipe:\\\\.\\pipe\\PipeName
`);
  process.exit(2);
}

// Print out the package's version when
// `--version` or `-v` are used
if (args['--version']) {
  console.log(version);
  process.exit();
}

if (!args['--listen']) {
  // default endpoint
  args['--listen'] = [String(3000)];
}

let file = args._[0];

if (!file) {
  try {
    const req = Module.createRequire(module.filename);
    const packageJson: unknown = req(
      path.resolve(process.cwd(), 'package.json'),
    );
    if (hasMain(packageJson)) {
      file = packageJson.main;
    } else {
      file = 'index.js';
    }
  } catch (err) {
    if (isNodeError(err) && err.code !== 'MODULE_NOT_FOUND') {
      logError(
        `Could not read \`package.json\`: ${err.message}`,
        'invalid-package-json',
      );
      process.exit(1);
    }
  }
}

if (!file) {
  logError('Please supply a file!', 'path-missing');
  process.exit(1);
}

if (!file.startsWith('/')) {
  file = path.resolve(process.cwd(), file);
}

if (!existsSync(file)) {
  logError(
    `The file or directory "${path.basename(file)}" doesn't exist!`,
    'path-not-existent',
  );
  process.exit(1);
}

function registerShutdown(fn: () => void) {
  let run = false;

  const wrapper = () => {
    if (!run) {
      run = true;
      fn();
    }
  };

  process.on('SIGINT', wrapper);
  process.on('SIGTERM', wrapper);
  process.on('exit', wrapper);
}

function startEndpoint(module: RequestHandler, endpoint: string) {
  const server = new http.Server(serve(module));

  server.on('error', (err) => {
    console.error('micro:', err.stack);
    process.exit(1);
  });

  server.listen(endpoint, () => {
    const details = server.address();
    registerShutdown(() => {
      console.log('micro: Gracefully shutting down. Please wait...');
      server.close();
      process.exit();
    });

    // `micro` is designed to run only in production, so
    // this message is perfect for prod
    if (typeof details === 'string') {
      console.log(`micro: Accepting connections on ${details}`);
    } else if (isAddressInfo(details)) {
      console.log(`micro: Accepting connections on port ${details.port}`);
    } else {
      console.log('micro: Accepting connections');
    }
  });
}

async function start() {
  if (file && args['--listen']) {
    const loadedModule = await handle(file);

    for (const endpoint of args['--listen']) {
      startEndpoint(loadedModule as RequestHandler, endpoint);
    }
  }
}

start()
  .then()
  .catch((error) => {
    if (error instanceof Error) {
      logError(error.message, 'STARTUP_FAILURE');
    }
    process.exit(1);
  });

function hasMain(packageJson: unknown): packageJson is { main: string } {
  return (
    typeof packageJson === 'object' &&
    packageJson !== null &&
    'main' in packageJson
  );
}

function isNodeError(
  error: unknown,
): error is { code: string; message: string } {
  return error instanceof Error && 'code' in error;
}

function isAddressInfo(obj: unknown): obj is AddressInfo {
  return 'port' in (obj as AddressInfo);
}
