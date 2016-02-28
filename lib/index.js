import { Server } from 'http';
import getRawBody from 'raw-body';
import typer from 'media-typer';

const DEV = 'development' === process.env.NODE_ENV;

export default function serve (fn, { onError = null } = {}) {
  return Server((req, res) => {
    run(req, res, fn, onError || sendError);
  });
}

export async function run (req, res, fn, onError) {
  try {
    await fn(req, res);
  } catch (err) {
    await onError(req, res, err);
  }
}

export async function json (req, { limit = '1mb' } = {}) {
  try {
    const type = req.headers['content-type'];
    const length = req.headers['content-length'];
    const encoding = typer.parse(type).parameters.charset;
    const str = await getRawBody(req, { limit, length, encoding });

    try {
      return JSON.parse(str);
    } catch (err) {
      throw createError(400, 'Invalid JSON', err);
    }
  } catch (err) {
    if ('entity.too.large' === err.type) {
      throw createError(413, `Body exceeded ${limit} limit`, err);
    } else {
      throw createError(400, 'Invalid body', err);
    }
  }
}

export function send (res, code, obj = null) {
  res.statusCode = code;

  if (null != obj) {
    let str;

    if ('object' === typeof obj) {
      // we stringify before setting the header
      // in case `JSON.stringify` throws and a
      // 500 has to be sent instead

      // the `JSON.stringify` call is split into
      // two cases as `JSON.stringify` is optimized
      // in V8 if called with only one argument
      if (DEV) {
        str = JSON.stringify(obj, null, 2);
      } else {
        str = JSON.stringify(obj);
      }
      res.setHeader('Content-Type', 'application/json');
    } else {
      str = obj;
    }

    res.setHeader('Content-Length', Buffer.byteLength(str));
    res.end(str);
  } else {
    res.end();
  }
}

export function sendError (req, res, { statusCode, message, stack }) {
  if (statusCode) {
    send(res, statusCode, DEV ? stack : message);
  } else {
    send(res, 500, DEV ? stack : 'Internal Server Error');
  }
  if (DEV) console.error(stack);
}

function createError (code, msg, orig) {
  const err = new Error(msg);
  err.statusCode = code;
  err.originalError = orig;
  return err;
}
