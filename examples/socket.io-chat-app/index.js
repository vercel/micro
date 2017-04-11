const micro = require('micro'),
      fs = require('fs');

const html = fs.readFileSync(__dirname + '/index.html')

const server = micro(async (req, res) => {
  console.log('Serving index.html');
  res.end(html);
});

const io = require('socket.io')(server);

// socket-io handlers are in websocket-server.js
require('./websocket-server.js')(io);

server.listen(4000);

// Micro expects a function to be exported
module.exports = () => console.log('YOLO');
