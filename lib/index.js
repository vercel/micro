// Native
const server = require('http').Server

// Packages
const getRawBody = require('raw-body')
const typer = require('media-typer')
const isStream = require('isstream')
const chalk = require('chalk')
const jsome = require('jsome')

const DEV = 'development' === process.env.NODE_ENV
jsome.colors = {
  num: 'cyan',
  str: 'green',
  bool: 'red',
  regex: 'blue',
  undef: 'grey',
  null: 'grey',
  attr: 'reset',
  quot: 'reset',
  punc: 'reset',
  brack: 'reset'
}

module.exports = exports = serve

exports.run = run
exports.json = json
exports.send = send
exports.sendError = sendError
exports.createError = createError

function serve(fn, {onError = null, log} = {}) {
  if (typeof log === 'undefined' && DEV) {
    log = 'dev'
  }

  if (onError) {
    console.warn('[DEPRECATED] onError is deprecated and will be removed in a future release. Please use your own try/catch as needed.')
  }

  return server((req, res) => {
    run(req, res, fn, onError || sendError, {log})
  })
}

async function run(req, res, fn, onError, {log}) {
  try {
    if (log === 'dev' || log === 'prod') {
      await logRequest(req, res, log)
    }

    const val = await fn(req, res)

    // return a non-null value -> send
    if (null !== val && undefined !== val) {
      send(res, res.statusCode || 200, val)
    }
  } catch (err) {
    await onError(req, res, err)
  }
}

async function json(req, {limit = '1mb'} = {}) {
  try {
    const type = req.headers['content-type']
    const length = req.headers['content-length']
    const encoding = typer.parse(type).parameters.charset
    const str = await getRawBody(req, {limit, length, encoding})

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

  if (null !== obj) {
    if (Buffer.isBuffer(obj)) {
      if (!res.getHeader('Content-Type')) {
        res.setHeader('Content-Type', 'application/octet-stream')
      }

      res.setHeader('Content-Length', obj.length)
      res.end(obj)
    } else if (isStream(obj)) {
      if (!res.getHeader('Content-Type')) {
        res.setHeader('Content-Type', 'application/octet-stream')
      }

      obj.pipe(res)
    } else {
      let str

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
      } else {
        str = obj
      }

      res.setHeader('Content-Length', Buffer.byteLength(str))
      res.end(str)
    }
  } else {
    res.end()
  }
}

function sendError(req, res, {statusCode, message, stack}) {
  if (statusCode) {
    send(res, statusCode, DEV ? stack : message)
  } else {
    send(res, 500, DEV ? stack : 'Internal Server Error')
  }

  console.error(stack)
}

function createError(code, msg, orig) {
  const err = new Error(msg)
  err.statusCode = code
  err.originalError = orig
  return err
}

let requestCounter = 0

async function logRequest(req, res, log) {
  const start = new Date()
  const requestIndex = ++requestCounter
  const dateString = `${chalk.grey(start.toLocaleTimeString())}`
  console.log(`> #${requestIndex} ${chalk.bold(req.method)} ${req.url}\t${dateString}`)

  if (log === 'dev') {
    try {
      const parsedJson = await json(req)
      jsome(parsedJson)
    } catch (err) {
      console.log(`JSON body could not be parsed: ${err.message}`)
    }
  }

  res.once('finish', () => {
    const delta = new Date() - start
    const time = delta < 10000 ? `${delta}ms` : `${Math.round(delta / 1000)}s`

    console.log(`< #${requestIndex} ${chalk.bold(res.statusCode)} [${time}]`)
  })
}
