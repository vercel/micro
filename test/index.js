import test from 'ava'
import { json, send } from 'micro-core'
import request from 'request-promise'
import listen from './_listen'
import sleep from 'then-sleep'
import resumer from 'resumer'

test('send(200, <String>)', async t => {
  const fn = async (req, res) => {
    send(res, 200, 'woot')
  }

  const url = await listen(fn)
  const res = await request(url)

  t.same(res, 'woot')
})

test('send(200, <Object>)', async t => {
  const fn = async (req, res) => {
    send(res, 200, { a: 'b' })
  }

  const url = await listen(fn)
  const res = await request(url, { json: true })

  t.same(res, { a: 'b' })
})

test('send(200, <Buffer>)', async t => {
  const fn = async (req, res) => {
    send(res, 200, new Buffer('muscle'))
  }

  const url = await listen(fn)
  const res = await request(url)

  t.same(res, 'muscle')
})

test('send(200, <Stream>)', async t => {
  const fn = async (req, res) => {
    send(res, 200, resumer().queue('waterfall').end())
  }

  const url = await listen(fn)
  const res = await request(url)

  t.same(res, 'waterfall')
})

test('send(<Number>)', async t => {
  const fn = async (req, res) => {
    send(res, 404)
  }

  const url = await listen(fn)

  try {
    await request(url)
  } catch (err) {
    t.same(err.statusCode, 404)
  }
})

test('return <String>', async t => {
  const fn = async (req, res) => {
    return 'woot'
  }

  const url = await listen(fn)
  const res = await request(url)

  t.same(res, 'woot')
})

test('return <Promise>', async t => {
  const fn = async (req, res) => {
    return new Promise(async (resolve) => {
      await sleep(100)
      resolve('I Promise')
    })
  }

  const url = await listen(fn)
  const res = await request(url)

  t.same(res, 'I Promise')
})

test('sync return <String>', async t => {
  const fn = (req, res) => {
    return 'argon'
  }

  const url = await listen(fn)
  const res = await request(url)

  t.same(res, 'argon')
})

test('return empty string', async t => {
  const fn = async (req, res) => {
    return ''
  }

  const url = await listen(fn)
  const res = await request(url)

  t.same(res, '')
})

test('return <Object>', async t => {
  const fn = async (req, res) => {
    return { a: 'b' }
  }

  const url = await listen(fn)
  const res = await request(url, { json: true })

  t.same(res, { a: 'b' })
})

test('return <Buffer>', async t => {
  const fn = async (req, res) => {
    return new Buffer('Hammer')
  }

  const url = await listen(fn)
  const res = await request(url)

  t.same(res, 'Hammer')
})

test('return <Stream>', async t => {
  const fn = async (req, res) => {
    return resumer().queue('River').end()
  }

  const url = await listen(fn)
  const res = await request(url)

  t.same(res, 'River')
})

test('throw with code', async t => {
  const fn = async (req, res) => {
    await sleep(100)
    const err = new Error('Error from test (expected)')
    err.statusCode = 402
    throw err
  }

  const url = await listen(fn)

  try {
    await request(url)
  } catch (err) {
    t.same(err.statusCode, 402)
  }
})

test('throw (500)', async t => {
  const fn = async (req, res) => {
    throw new Error('500 from test (expected)')
  }

  const url = await listen(fn)

  try {
    await request(url)
  } catch (err) {
    t.same(err.statusCode, 500)
  }
})

test('send(200, <Stream>) with error on same tick', async t => {
  const fn = async (req, res) => {
    const stream = resumer().queue('error-stream')
    send(res, 200, stream)

    stream.emit('error', new Error('500 from test (expected)'))
    stream.end()
  }

  const url = await listen(fn)

  try {
    await request(url)
    t.fail()
  } catch (err) {
    t.same(err.statusCode, 500)
  }
})

test('custom error', async t => {
  const fn = async (req, res) => {
    sleep(50)
    throw new Error('500 from test (expected)')
  }

  const onError = (req, res, err) => {
    send(res, 200, 'got error')
  }

  const url = await listen(fn, { onError })
  const res = await request(url)

  t.same(res, 'got error')
})

test('custom async error', async t => {
  const fn = async (req, res) => {
    sleep(50)
    throw new Error('500 from test (expected)')
  }

  const onError = async (req, res, err) => {
    await sleep(50)
    send(res, 200, 'got async error')
  }

  const url = await listen(fn, { onError })
  const res = await request(url)

  t.same(res, 'got async error')
})

test('json parse error', async t => {
  const fn = async (req, res) => {
    const body = await json(req)
    send(res, 200, body.woot)
  }

  const url = await listen(fn)

  try {
    await request(url, {
      method: 'POST',
      body: '{ "bad json" }',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (err) {
    t.same(err.statusCode, 400)
  }
})

test('json', async t => {
  const fn = async (req, res) => {
    const body = await json(req)
    send(res, 200, { response: body.some.cool })
  }

  const url = await listen(fn)

  const body = await request(url, {
    method: 'POST',
    body: { some: { cool: 'json' } },
    json: true
  })

  t.same(body.response, 'json')
})

test('json limit (below)', async t => {
  const fn = async (req, res) => {
    const body = await json(req, { limit: 100 })
    send(res, 200, { response: body.some.cool })
  }

  const url = await listen(fn)

  const body = await request(url, {
    method: 'POST',
    body: { some: { cool: 'json' } },
    json: true
  })

  t.same(body.response, 'json')
})

test('json limit (over)', async t => {
  const fn = async (req, res) => {
    const body = await json(req, { limit: 3 })
    send(res, 200, { response: body.some.cool })
  }

  const url = await listen(fn)

  try {
    await request(url, {
      method: 'POST',
      body: { some: { cool: 'json' } },
      json: true
    })
  } catch (err) {
    t.same(err.statusCode, 413)
  }
})

test('json circular', async t => {
  const fn = async (req, res) => {
    const obj = { circular: true }
    obj.obj = obj
    send(res, 200, obj)
  }

  const url = await listen(fn)

  try {
    await request(url, { json: true })
  } catch (err) {
    t.same(err.statusCode, 500)
  }
})

test('no async', async t => {
  const fn = (req, res) => {
    send(res, 200, { a: 'b' })
  }

  const url = await listen(fn)
  const obj = await request(url, { json: true })

  t.same(obj.a, 'b')
})

test('limit included in error', async t => {
  const fn = async (req, res) => {
    const body = await json(req, { limit: 3 })
    send(res, 200, { response: body.some.cool })
  }

  const url = await listen(fn)

  try {
    await request(url, {
      method: 'POST',
      body: { some: { cool: 'json' } },
      json: true
    })
  } catch (err) {
    t.ok(/exceeded 3 limit/.test(err.message))
  }
})
