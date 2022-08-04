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

void test(`handle Babel's non-async function`, async (t) => {
  const dir = t.testdir({
    'babel-function-export.js': `"use strict";

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;
    
    var _default = (req, res) => {
      res.end("Test");
    };
    
    exports.default = _default;
    `,
  });

  const result = await handle(`${dir}/babel-function-export.js`);
  t.type(result, 'function');
});

void test(`handle Babel's async function`, async (t) => {
  const dir = t.testdir({
    'babel-async-export.js': `"use strict";

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;
    
    var _default = async (req, res) => {
      res.end("Test");
    };
    
    exports.default = _default;
    `,
  });

  const result = await handle(`${dir}/babel-async-export.js`);
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
