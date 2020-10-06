const express = require('express');
const passport = require('./middleware/passport');
const indexRouter = require('./routes/index');
const controlRouter = require('./routes/control');
const enumerateMusic = require('./helpers/enumerateMusic');
const morgan = require('morgan');
const http = require('http');
const bodyParser = require('body-parser');
const advanceTimestamp = require('./helpers/advanceTimestamp');
const gotoNextSong = require('./helpers/controlGotoNextSong');
const nextQueue = require('./helpers/nextQueue');
const prevQueue = require('./helpers/prevQueue');
const afterEnumeration = require('./helpers/afterEnumeration');
const WebSocket = require('ws');

require('dotenv').config();
const app = express();

app.passport = passport.passport;
app.pool = passport.pool;

app.use(app.passport.initialize());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

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

const enumMusic = enumerateMusic();
app.locals.songs = new Promise((resolve, reject) => {
  enumMusic.then((songs) => {
    resolve(songs);
  });

  enumMusic.catch((err) => reject(err));
});

app.locals.songs.then((value) => {
  app.locals.songs = value;
});

enumMusic.then(async (_) => {
  const after = afterEnumeration(app, await app.locals.songs);
  after.catch((err) => console.error(err));

  app.use(morgan('dev'));
  app.use((req, res, next) => {
    req.app.passport.authenticate(
      'jwt',
      { session: false },
      (err, user, info) => {
        if (err) next(err);
        else if (user) res.locals.currentUser = user;
        next();
      }
    )(req, res);
  });

  app.use('/', indexRouter);
  app.use('/control', controlRouter);

  wss.on('connection', (ws) => {
    ws.send('Welcome to the server!');
  });

  server.listen(process.env.PORT || 8080, '0.0.0.0', () => {
    console.log(
      'server started on at ' +
        server.address().address +
        ':' +
        server.address().port
    );
  });
});
enumMusic.catch((err) => {
  console.error(err);
});
