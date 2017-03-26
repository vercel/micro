// Packages
const test = require('ava');
const request = require('request-promise');
const listen = require('test-listen');

process.env.NODE_ENV = 'production';
const micro = require('../lib/server');

const getUrl = fn => {
  const srv = micro(fn);

  return listen(srv);
};

test.serial('errors are printed in console in production', async t => {
  let logged = false;
  const _error = console.error;
  console.error = () => {
    logged = true;
  };

  const fn = () => {
    throw new Error('Bang');
  };

  const url = await getUrl(fn);
  try {
    await request(url);
  } catch (err) {
    t.true(logged);
    t.deepEqual(err.statusCode, 500);
    console.error = _error;
  }
});
