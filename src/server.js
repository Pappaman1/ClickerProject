const http = require('http');
const path = require('path');
const express = require('express');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const app = express();

app.use('/assets', express.static(path.resolve(`${__dirname}/../client/images/`)));

app.use('/css', express.static(path.resolve(`${__dirname}/../client/css/`)));

app.get('/', (req, res) => {
  res.sendFile(path.resolve(`${__dirname}/../client/client.html`));
});

const server = http.createServer(app);
const io = socketio(server);
const users = io.sockets.sockets;

server.listen(port, (err) => {
  if (err) {
    throw err;
  }
  console.log(`Listening on port ${port}`);
});

let serverTotalClicks = 0;
let currentClickValue = 0;

//handles what happens when someone connects to the socket through the client
const onJoined = (sock) => {
  const socket = sock;
  socket.on('join', (data) => {
    console.log(data.name);
    // message back to new user
    const joinMsg = {
      name: 'server',
      msg: `There are ${Object.keys(users).length} users online`,
    };

    socket.name = data.name;
    socket.emit('msg', joinMsg);

    users[socket.name] = socket.name;

    socket.join('room1');
    const response = {
      name: 'server',
      msg: `${data.name} has joined the room.`,
    };
    socket.broadcast.to('room1').emit('msg', response);

    console.log(`${data.name} joined`);
    socket.emit('msg', { name: 'server', msg: 'You joined the room' });
  });
};

//sends data to the chat
const onMsg = (sock) => {
  const socket = sock;
  socket.on('msgToServer', (data) => {
    io.sockets.in('room1').emit('msg', { name: socket.name, msg: data.msg });
  });
};

//removes users from socket when they disconnect
const onDisconnect = (sock) => {
  const socket = sock;
  socket.on('disconnect', (data) => {
    console.dir(data);

    const message = `${socket.name} has left the room.`;
    socket.broadcast.to('room1').emit('msg', { name: 'server', msg: message });
    socket.leave('room1');

    delete users[socket.name];
  });
};

//increases dollar amount when the dollar sign is clicked
const dollarClicked = (sock) => {
  const socket = sock;
  socket.on('dollarClicked', (data) => {
    serverTotalClicks += data;
    io.sockets.in('room1').emit('updatedTotalClicks', serverTotalClicks);
  });
};

//subtracts money from the server total
const subtractServerMoney = (sock) => {
  const socket = sock;
  socket.on('subtractServerMoney', (data) => {
    serverTotalClicks -= data;
    io.sockets.in('room1').emit('updatedTotalClicks', serverTotalClicks);
  });
};

//upgrades everyones dollars/click
const upgradeServer = (sock) => {
  const socket = sock;
  socket.on('upgradeServer', (data) => {
    let multiplied = data;
    multiplied *= 2;
    currentClickValue = multiplied;
    io.sockets.in('room1').emit('updatedClickValue', currentClickValue);
    io.sockets.in('room1').emit('boughtServerUpgradeMsg', { name: socket.name });
  });
};

//halves every other players money
const halfPlayerMoney = (sock) => {
  const socket = sock;
  socket.on('halfPlayerMoney', (data) => {
    let halved = data;
    halved /= 2;
    socket.broadcast.to('room1').emit('moneyHalved', halved);
  });
};

//houses every function that is available to the
io.sockets.on('connection', (socket) => {
  onJoined(socket);
  dollarClicked(socket);
  subtractServerMoney(socket);
  upgradeServer(socket);
  onMsg(socket);
  onDisconnect(socket);
  halfPlayerMoney(socket);
});
