// Native
const server = require('http').Server

// Packages
const getRawBody = require('raw-body')
const typer = require('media-typer')
const isStream = require('isstream')

const DEV = 'development' === process.env.NODE_ENV
const TESTING = 'test' === process.env.NODE_ENV

const serve = fn => server((req, res) => {
  run(req, res, fn, sendError)
})

module.exports = exports = serve

exports.run = run
exports.json = json
exports.send = send
exports.sendError = sendError
exports.createError = createError

async function run(req, res, fn, onError) {
  try {
    const val = await fn(req, res)

    // Return 204 No Content if value is null
    if (null === val) {
      send(res, 204, null)
    }

    // Return a undefined-null value -> send
    if (undefined !== val) {
      send(res, res.statusCode || 200, val)
    }
  } catch (err) {
    await onError(req, res, err)
  }
}

// maps requests to buffered raw bodies so that
// multiple calls to `json` work as expected
const rawBodyMap = new WeakMap()

async function json(req, {limit = '1mb'} = {}) {
  try {
    const type = req.headers['content-type']
    const length = req.headers['content-length']
    const encoding = typer.parse(type).parameters.charset

    let str = rawBodyMap.get(req)
    if (!str) {
      str = await getRawBody(req, {limit, length, encoding})
      rawBodyMap.set(req, str)
    }

    try {
      return JSON.parse(str)
    } catch (err) {
      throw createError(400, 'Invalid JSON', err)
    }
  } catch (err) {
    if ('entity.too.large' === err.type) {
      throw createError(413, `Body exceeded ${limit} limit`, err)
    } else {
      throw createError(400, 'Invalid body', err)
    }
  }
}

function send(res, code, obj = null) {
  res.statusCode = code

  if (null === obj) {
    res.end()
    return
  }

  if (Buffer.isBuffer(obj)) {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/octet-stream')
    }

    res.setHeader('Content-Length', obj.length)
    res.end(obj)
    return
  }

  if (isStream(obj)) {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/octet-stream')
    }

    obj.pipe(res)
    return
  }

  let str = obj

  if ('object' === typeof obj) {
    // we stringify before setting the header
    // in case `JSON.stringify` throws and a
    // 500 has to be sent instead

    // the `JSON.stringify` call is split into
    // two cases as `JSON.stringify` is optimized
    // in V8 if called with only one argument
    if (DEV) {
      str = JSON.stringify(obj, null, 2)
    } else {
      str = JSON.stringify(obj)
    }
    res.setHeader('Content-Type', 'application/json')
  }

  res.setHeader('Content-Length', Buffer.byteLength(str))
  res.end(str)
}

function sendError(req, res, {statusCode, message, stack}) {
  if (statusCode) {
    send(res, statusCode, DEV ? stack : message)
  } else {
    send(res, 500, DEV ? stack : 'Internal Server Error')
  }

  if (!TESTING) {
    console.error(stack)
  }
}

function createError(code, msg, orig) {
  const err = new Error(msg)
  err.statusCode = code
  err.originalError = orig
  return err
}
