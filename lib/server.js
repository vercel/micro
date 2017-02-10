// Native
const server = require('http').Server

// Packages
const getRawBody = require('raw-body')
const typer = require('media-typer')
const isStream = require('isstream')
const Q = require('q')

const DEV = process.env.NODE_ENV === 'development'
const TESTING = process.env.NODE_ENV === 'test'

const serve = fn => server(Q.async(function * (req, res) {
  yield exports.run(req, res, fn)
}))

module.exports = exports = serve

exports.send = send
exports.sendError = sendError
exports.createError = createError

exports.run = Q.async(function * (req, res, fn) {
  try {
    const val = yield fn(req, res)

    if (val === null) {
      send(res, 204, null)
    }

    // Return a undefined-null value -> send
    if (undefined !== val) {
      send(res, res.statusCode || 200, val)
    }
  } catch (err) {
    sendError(req, res, err)
  }
})

// maps requests to buffered raw bodies so that
// multiple calls to `json` work as expected
const rawBodyMap = new WeakMap()

const returnJSON = (resolve, reject, str) => {
  try {
    resolve(JSON.parse(str))
  } catch (err) {
    reject(createError(400, 'Invalid JSON', err))
  }
}

exports.json = (req, {limit = '1mb'} = {}) => new Promise((resolve, reject) => {
  const type = req.headers['content-type']
  const length = req.headers['content-length']
  const encoding = typer.parse(type).parameters.charset

  let str = rawBodyMap.get(req)

  if (str) {
    returnJSON(resolve, reject, str)
    return
  }

  getRawBody(req, {limit, length, encoding}).then(buf => {
    str = buf
    rawBodyMap.set(req, str)

    returnJSON(resolve, reject, str)
  }).catch(err => {
    if (err.type === 'entity.too.large') {
      throw createError(413, `Body exceeded ${limit} limit`, err)
    } else {
      throw createError(400, 'Invalid body', err)
    }
  })
})

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

  if (typeof obj === 'object') {
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
