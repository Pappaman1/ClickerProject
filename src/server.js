const http = require('http');
const path = require('path');
const express = require('express');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const app = express();

app.use('/assets', express.static(path.resolve(`${__dirname}/../client/images/`)));

app.get('/', (req, res) => {
  res.sendFile(path.resolve(`${__dirname}/../client/client.html`));
});

const server = http.createServer(app);
const io = socketio(server);


server.listen(port, (err) => {
  if (err) {
    throw err;
  }
  console.log(`Listening on port ${port}`);
});

let serverTotalClicks = 0;

const onJoined = (sock) => {
  const socket = sock;
  socket.on('join', () => {
    console.log('user joined');

    socket.join('room1');
  });
};

const dollarClicked = (sock) => {
  const socket = sock;
  socket.on('dollarClicked', (data) => {
    serverTotalClicks += data;
    io.sockets.in('room1').emit('updatedTotalClicks', serverTotalClicks);
  });
};

const buyServerUpgrade = (sock) => {
  const socket = sock;
  socket.on('buyServerUpgrade', (data) => {
    serverTotalClicks -= data;
    io.sockets.in('room1').emit('updatedTotalClicks', serverTotalClicks);
  });
};

io.sockets.on('connection', (socket) => {
  onJoined(socket);
  dollarClicked(socket);
  buyServerUpgrade(socket);
});
