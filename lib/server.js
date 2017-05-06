// Native
const server = require('http').Server

// Packages
const getRawBody = require('raw-body')
const typer = require('media-typer')
const isStream = require('isstream')
const Promise = require('bluebird')

const DEV = process.env.NODE_ENV === 'development'
const TESTING = process.env.NODE_ENV === 'test'

const serve = fn => server((req, res) => exports.run(req, res, fn))

module.exports = serve
exports = serve
exports.default = serve

exports.send = send
exports.sendError = sendError
exports.createError = createError

exports.run = (req, res, fn) =>
  new Promise(resolve => resolve(fn(req, res)))
    .then(val => {
      if (val === null) {
        send(res, 204, null)
        return
      }

      // Send value if it is not undefined, otherwise assume res.end
      // will be called later
      if (undefined !== val) {
        send(res, res.statusCode || 200, val)
      }
    })
    .catch(err => sendError(req, res, err))

// Maps requests to buffered raw bodies so that
// multiple calls to `json` work as expected
const rawBodyMap = new WeakMap()

const parseJSON = str => {
  try {
    return JSON.parse(str)
  } catch (err) {
    throw createError(400, 'Invalid JSON', err)
  }
}

exports.buffer = (req, { limit = '1mb', encoding } = {}) =>
  Promise.resolve().then(() => {
    const type = req.headers['content-type'] || 'text/plain'
    const length = req.headers['content-length']
    encoding = encoding === undefined
      ? typer.parse(type).parameters.charset
      : encoding

    const body = rawBodyMap.get(req)

    if (body) {
      return body
    }

    return getRawBody(req, { limit, length, encoding })
      .then(buf => {
        rawBodyMap.set(req, buf)
        return buf
      })
      .catch(err => {
        if (err.type === 'entity.too.large') {
          throw createError(413, `Body exceeded ${limit} limit`, err)
        } else {
          throw createError(400, 'Invalid body', err)
        }
      })
  })

exports.text = (req, { limit, encoding } = {}) =>
  exports.buffer(req, { limit, encoding }).then(body => body.toString(encoding))

exports.json = (req, opts) =>
  exports.text(req, opts).then(body => parseJSON(body))

function send(res, code, obj = null) {
  res.statusCode = code

  if (obj === null) {
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

  if (typeof obj === 'object' || typeof obj === 'number') {
    // We stringify before setting the header
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

    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json')
    }
  }

  res.setHeader('Content-Length', Buffer.byteLength(str))
  res.end(str)
}

function sendError(req, res, { statusCode, status, message, stack }) {
  statusCode = statusCode || status

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
