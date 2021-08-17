const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const compression = require('compression');

const indexRouter = require('./routes/index');
const controlRouter = require('./routes/control');
const enumerateMusic = require('./helpers/enumerateMusic');
const afterEnumeration = require('./helpers/afterEnumeration');
const firebaseInit = require('./middleware/firebaseInit');
const addAppDeps = require('./middleware/addAppDeps');
const { signInWithCustomToken } = require('firebase/auth');

require('dotenv').config();
const app = express();

app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan('dev'));
app.use((req, res, next) => {
  const key = req.header('Authorization');

  if (key) {
    signInWithCustomToken(app.auth, key)
      .then((userCredentials) => {
        res.locals.currentUser = userCredentials;
        next();
      })
      .catch((err) => next(err));
  } else next();
});

addAppDeps(app);
firebaseInit(app);

const enumMusic = enumerateMusic(app);
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
  afterEnumeration(app, await app.locals.songs).catch((err) =>
    console.error(err)
  );

  app.use('/', indexRouter);
  app.use('/control', controlRouter);

  app.wss.on('connection', (ws) => {
    ws.on('message', function incoming(message) {
      if (message === 'error') ws.send('reset');
    });
  });

  app.server.listen(process.env.PORT || 8080, '0.0.0.0', () => {
    console.log(
      'server started on at ' + app.server.address().address ||
        'running at port: ' + app.server.address().port
    );
  });
});

enumMusic.catch((err) => {
  console.error(err);
});
