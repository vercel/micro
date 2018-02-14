const micro = require('micro')
const fs = require('fs')
const path = require('path')

const document = path.join(__dirname, 'index.html')
const html = fs.readFileSync(document)

const server = micro(async (req, res) => {
  console.log('Serving index.html')
  res.end(html)
})

const io = require('socket.io')(server)

// socket-io handlers are in websocket-server.js
require('./websocket-server.js')(io)

server.listen(4000)
