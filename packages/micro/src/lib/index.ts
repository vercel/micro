// Native
import { Stream, Readable } from 'stream';
// Packages
import contentType from 'content-type';
import getRawBody from 'raw-body';
import type { RawBodyError } from 'raw-body';
//Types
import type { IncomingMessage, ServerResponse, RequestListener } from 'http';

// slight modification of is-stream https://github.com/sindresorhus/is-stream/blob/c918e3795ea2451b5265f331a00fb6a8aaa27816/license
function isStream(stream: unknown): stream is Stream {
  return (
    stream !== null &&
    typeof stream === 'object' &&
    stream instanceof Stream &&
    typeof stream.pipe === 'function'
  );
}

function readable(stream: unknown): stream is Readable {
  return (
    isStream(stream) && // TODO: maybe this isn't needed because we could use only the checks below
    stream instanceof Readable &&
    stream.readable
  );
}

export type RequestHandler = (
  req: IncomingMessage,
  res: ServerResponse,
) => unknown;

type Serve = (fn: RequestHandler) => RequestListener;

export const serve: Serve = (fn) => (req, res) => run(req, res, fn);

export class HttpError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, HttpError.prototype);
  }

  statusCode?: number;
  originalError?: Error;
}

function isError(error: unknown): error is Error | HttpError {
  return error instanceof Error || error instanceof HttpError;
}

export const createError = (code: number, message: string, original: Error) => {
  const err = new HttpError(message);

  err.statusCode = code;
  err.originalError = original;

  return err;
};

export const send = (
  res: ServerResponse,
  code: number,
  obj: unknown = null,
) => {
  res.statusCode = code;

  if (obj === null) {
    res.end();
    return;
  }

  if (Buffer.isBuffer(obj)) {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/octet-stream');
    }

    res.setHeader('Content-Length', obj.length);
    res.end(obj);
    return;
  }

  if (obj instanceof Stream || readable(obj)) {
    //TODO: Wouldn't (obj instanceof Stream) be the only check here? Do we specifically need a Readable stream or a Stream object that's not of NodeJS Stream?
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/octet-stream');
    }

    obj.pipe(res);
    return;
  }

  let str = obj;

  if (typeof obj === 'object' || typeof obj === 'number') {
    // We stringify before setting the header
    // in case `JSON.stringify` throws and a
    // 500 has to be sent instead
    str = JSON.stringify(obj);

    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
  }

  if (typeof str === 'string') {
    res.setHeader('Content-Length', Buffer.byteLength(str));
  }

  res.end(str);
};

export const sendError = (
  req: IncomingMessage,
  res: ServerResponse,
  errorObj: Error | HttpError,
) => {
  if ('statusCode' in errorObj && errorObj.statusCode) {
    send(res, errorObj.statusCode, errorObj.message);
  } else send(res, 500, 'Internal Server Error');

  if (errorObj instanceof Error) {
    // eslint-disable-next-line no-console
    console.error(errorObj.stack);
  } else {
    // eslint-disable-next-line no-console
    console.warn('thrown error must be an instance Error');
  }
};

export const run = (
  req: IncomingMessage,
  res: ServerResponse,
  fn: RequestHandler,
) =>
  new Promise((resolve) => {
    resolve(fn(req, res));
  })
    .then((val) => {
      if (val === null) {
        send(res, 204, null);
        return;
      }

      // Send value if it is not undefined, otherwise assume res.end
      // will be called later
      if (val !== undefined) {
        send(res, res.statusCode || 200, val);
      }
    })
    .catch((err: unknown) => {
      if (isError(err)) {
        sendError(req, res, err);
      }
    });

// Maps requests to buffered raw bodies so that
// multiple calls to `json` work as expected
const rawBodyMap = new WeakMap<IncomingMessage, Buffer>();

const parseJSON = (str: string): unknown => {
  try {
    return JSON.parse(str);
  } catch (err: unknown) {
    throw createError(400, 'Invalid JSON', err as Error);
  }
};

export interface BufferInfo {
  limit?: string | number | undefined;
  encoding?: BufferEncoding;
}

function isRawBodyError(error: unknown): error is RawBodyError {
  return 'type' in (error as RawBodyError);
}

export const buffer = (
  req: IncomingMessage,
  { limit = '1mb', encoding }: BufferInfo = {},
) =>
  Promise.resolve().then(() => {
    const type = req.headers['content-type'] || 'text/plain';
    const length = req.headers['content-length'];

    const body = rawBodyMap.get(req);

    if (body) {
      return body;
    }

    return getRawBody(req, {
      limit,
      length,
      encoding: encoding ?? contentType.parse(type).parameters.charset,
    })
      .then((buf) => {
        rawBodyMap.set(req, buf);
        return buf;
      })
      .catch((err) => {
        if (isRawBodyError(err) && err.type === 'entity.too.large') {
          throw createError(413, `Body exceeded ${limit} limit`, err);
        } else {
          throw createError(400, 'Invalid body', err as Error);
        }
      });
  });

export const text = (
  req: IncomingMessage,
  { limit, encoding }: BufferInfo = {},
) => buffer(req, { limit, encoding }).then((body) => body.toString(encoding));

export const json = (req: IncomingMessage, opts: BufferInfo = {}) =>
  text(req, opts).then((body) => parseJSON(body));
