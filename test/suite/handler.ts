import { test } from 'tap';
import { handle } from 'micro/src/lib/handler';
import { stub } from 'sinon';

void test('handle a non-async function', async (t) => {
  const dir = t.testdir({
    'regular-function-export.js': `module.exports = () => 'Test';`,
  });

  const result = await handle(`${dir}/regular-function-export.js`);
  t.type(result, 'function');
});

void test('handle async function', async (t) => {
  const dir = t.testdir({
    'promise-export.js': `module.exports = async () => 'Test';`,
  });

  const result = await handle(`${dir}/promise-export.js`);
  t.type(result, 'function');
});

void test(`handle ESM's non-async function`, async (t) => {
  const dir = t.testdir({
    'esm-function-export.mjs': `export default () => 'Hello ESM';`,
  });

  const result = await handle(`${dir}/esm-function-export.mjs`);
  t.type(result, 'function');
});

void test(`handle ESM's async function`, async (t) => {
  const dir = t.testdir({
    'esm-async-export.mjs': `export default async () => 'Hello ESM';`,
  });

  const result = await handle(`${dir}/esm-async-export.mjs`);
  t.type(result, 'function');
});

void test('process.exit when handling an invalid export', async (t) => {
  const dir = t.testdir({
    'regular-object.js': `module.exports = {};`,
  });
  const processStub = stub(process, 'exit').callsFake(() => {
    throw new Error('Fake');
  });

  await t.rejects(handle(`${dir}/regular-object.js`), { message: 'Fake' });
  t.equal(processStub.calledOnceWith(1), true);

  processStub.restore();
});

void test('process.exit when handling and inexisting file', async (t) => {
  const dir = t.testdir();
  const processStub = stub(process, 'exit').callsFake(() => {
    throw new Error('Fake');
  });

  await t.rejects(handle(`${dir}/foo/bar`), { message: 'Fake' });
  t.equal(processStub.calledOnceWith(1), true);

  processStub.restore();
});
