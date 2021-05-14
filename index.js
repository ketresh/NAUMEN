const express = require('express');
const http = require('http');
const SocketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new SocketIO.Server(server);

app.use(express.static('../dist'));

var ncc = require("../ncc");
var nccClient = new ncc.Client({
  host: '127.0.0.1',
  port: 3242,
  key_file: '../key.service.workplaces_map.xml',
  reconnect: true,
  reconnect_interval: 3000,
  logproto: ['NCC', 'NCCN', 'XML']
});

const workplaces = {};

setInterval(() => console.log(workplaces), 5000);

function AddEdit(login, { peer_ip, state }) {
  if (!(login in workplaces)) {
    workplaces[login] = { peer_ip, state };
  } else {
    if (peer_ip) workplaces[login].peer_ip = peer_ip;
    if (state) workplaces[login].state = state;
  }
}


nccClient.ncc.on('NCCN_Event_PeerRegistered', (err, params) => AddEdit(params.login, { peer_ip: params.peer_ip }));

nccClient.ncc.on('NCC_FullBuddyList_null', (err, params, p) => {
  console.log(p.NCC.FullBuddyList[0].Endpoint.forEach((endpoint) => { AddEdit(endpoint.$.login, { state: endpoint.State[0].$.value }) }))
});

nccClient.ncc.on('NCC_ShortBuddyList_null', (err, params, p) => {
  console.log(p.NCC.ShortBuddyList[0].Endpoint.forEach((endpoint) => { AddEdit(endpoint.$.login, { state: endpoint.State[0].$.value }) }))
});

nccClient.on('ready', () => {
  nccClient.ncc.send('NCCN', ['Command', { 'name': 'SubscribeToGroup' }], { 'peer': nccClient.peer_id, 'group': '_client_registered' });
  //nccClient.ncc.send('NCCN', ['Command', { 'name': 'SubscribeToGroup' }], { 'peer': nccClient.peer_id, 'group': '_client_unregistered' });
  nccClient.ncc.send('NCCN', ['Request', { 'name': 'PeersInfo' }], {}, (err, params, p) => {
    p.NCCN.Response[0].LE.map((el) => el.Params[0].$).forEach((el) => {
      const { login, peer_ip, role } = el;
      if (role == 'client') {
        if (!(login in workplaces))
          workplaces[login] = { peer_ip };
        else
          workplaces[login].peer_ip = peer_ip;
      }
    })
  });
  nccClient.ncc.send('NCC', ['Request', { 'name': 'Register' }], { 'protocol_version': 900 },
    (err) => {
      if (err) {
        console.error(err);
        process.exit(2);
      } else {
        nccClient.ncc.send('NCC', ['Request', { 'name': 'Subscribe' }], { 'list': 'buddylist', 'enabled': true })
      }
    }
  );
});

nccClient.connect((err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});

setInterval(() => {
	io.sockets.send(workplaces)
}, 3000);

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.send(workplaces);

  socket.on('disconnect', () => {
    console.log('user disconnected');

  });
});



server.listen(3000, '0.0.0.0', function () {
  console.info('listening on', this.address());
});
