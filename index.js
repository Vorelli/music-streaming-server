const express = require('express');
const path = require('path');
const indexRouter = require('./routes/index');
const controlRouter = require('./routes/control');
const status = require('./enums/status');
const enumerateMusic = require('./helpers/enumerateMusic');
const morgan = require('morgan');
const http = require('http');
const advanceTimestamp = require('./helpers/advanceTimestamp');
const gotoNextSong = require('./helpers/controlGotoNextSong');
const nextQueue = require('./helpers/nextQueue');
const prevQueue = require('./helpers/prevQueue');
const afterEnumeration = require('./helpers/afterEnumeration');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
app.wss = wss;

app.locals.queues = [];
app.locals.currentQueue = undefined;

app.advanceTimestamp = advanceTimestamp;
app.nextQueue = nextQueue;
app.prevQueue = prevQueue;
app.gotoNextSong = gotoNextSong;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

const enumerateProcess = enumerateMusic();
enumerateProcess.then((songs) => afterEnumeration(app, songs));
enumerateProcess.catch((err) => {
  console.error(err);
});

app.use(morgan('dev'));
app.use('/', indexRouter);
app.use('/control', controlRouter);

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    console.log(data);
    ws.send('hiya thank you for the data!');
  });

  ws.send('Welcome to the server!');
});

server.listen(process.env.PORT || 8080, () => {
  console.log('server started on port: ' + server.address().port);
});
