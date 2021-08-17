const http = require('http');
const WebSocket = require('ws');
const nextQueue = require('../helpers/nextQueue');
const prevQueue = require('../helpers/prevQueue');
const advanceTimestamp = require('../helpers/advanceTimestamp');
const gotoNextSong = require('../helpers/controlGotoNextSong');

const addAppDeps = function (app) {
  app.advanceTimestamp = advanceTimestamp;
  app.nextQueue = nextQueue;
  app.prevQueue = prevQueue;
  app.gotoNextSong = gotoNextSong;
  app.locals.queues = [];
  app.locals.currentQueue = undefined;
  const server = http.createServer(app);
  app.server = server;
  const wss = new WebSocket.Server({ server });
  app.wss = wss;
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Authorization, Content-Type'
    );
    next();
  });
};

module.exports = addAppDeps;
