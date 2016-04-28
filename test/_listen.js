import micro from 'micro-core'

export default async function (fn, opts) {
  const srv = micro(fn, opts)

  return new Promise((resolve, reject) => {
    srv.listen(err => {
      if (err) return reject(err)
      const { port } = srv.address()
      resolve(`http://localhost:${port}`)
    })
  })
}
