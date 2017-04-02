// Ours
const serve = require('./server');
const listening = require('./listening');
const getModule = require('./module');

module.exports = async (file, flags, module = getModule(file)) => {
  const server = serve(module);

  const { port } = flags;
  const host = flags.host === '0.0.0.0' ? null : flags.host;

  server
    .listen(port, host, err => {
      if (err) {
        console.error('micro:', err.stack);

        // eslint-disable-next-line unicorn/no-process-exit
        process.exit(1);
      }

      return listening(server, host, flags.silent);
    })
    .on('error', err => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${flags.port} is already in use.`);
      } else {
        console.error(err);
      }

      // eslint-disable-next-line unicorn/no-process-exit
      process.nextTick(() => process.exit(1));
    });
};
