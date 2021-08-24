const validator = require('express-validator');
const { validationResult } = require('express-validator');
const formidable = require('formidable');
const controlPausePlay = require('../helpers/controlPausePlay');
const controlGotoNextSong = require('../helpers/controlGotoNextSong');
const controlGotoPrevSong = require('../helpers/controlGotoPrevSong');
const {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} = require('firebase/auth');
const { app } = require('firebase-admin');
const afterEnumeration = require('../helpers/afterEnumeration');

module.exports.indexGET = function (req, res, next) {
  res.json({
    message: `
    Welcome to the music streaming server controls section.
    Below is a list of commands used to control the server.
    [X][ ] GET  at /control            - Controls the server. Returns this list of commands to be used to control server.
    [X][ ] POST at /control/login      - Returns a login token for use by the music-streaming-controller.
    [X][ ] POST at /control/signup     - Sign up with the email, password and password confirmation in the request body. Returns a token if successful.
    [X][*] GET  at /control/authCheck  - Returns if token is authorized.
    [X][*] GET  at /control/songs      - Returns all of the songs the server can play.
    [X][*] GET  at /control/queue      - Returns the currently playing queue if authorized by token.
    [X][*] POST at /control/queue      - Sets the currently playing queue.
    [X][*] GET  at /control/playpause  - Plays/pauses current song.
    [X][*] GET  at /control/next       - Skips the current song and starts playing the next song.
    [X][*] GET  at /control/prev       - Goes to previous song.
    [X][*] POST at /control/time       - Controls the time of the currently played song.
    * - Designates which actions require authorization.
    X - Designates which actions have been coded (DEVELOPMENT)
    `,
  });
};

module.exports.loginPOST = [
  (req, res, next) => {
    const form = formidable.IncomingForm({ multiples: true });
    form.parse(req, function (err, fields) {
      if (err) next(err);
      else {
        Object.keys(fields).forEach((key) => {
          req.body[key] = fields[key];
        });
      }
    });
    next();
  },

  validator.body('*').escape(),

  validator
    .check('username', 'Email entered was not valid.')
    .isEmail()
    .isLength({ min: 5 }),
  validator
    .check('password', 'Password must be at least 8 characters long.')
    .isLength({ min: 8 }),

  (req, res, next) => {
    const errors = validationResult(req);

    signInWithEmailAndPassword(
      req.app.auth,
      req.body.username,
      req.body.password
    )
      .then((userCredential) => {
        req.app.admin
          .auth()
          .createCustomToken(userCredential.user.uid)
          .then((token) => {
            res.json({ token });
          });
      })
      .catch((err) => {
        console.error('error:' + err);
        next(err);
      });

    if (!errors.isEmpty()) {
      res
        .status(400)
        .json({ message: 'Failed to authenticate. Check errors.', errors });
    }
  },
];

module.exports.signupPOST = [
  validator.body('*').escape(),

  validator
    .check('username', 'You must enter a valid email.')
    .isEmail()
    .isLength({ min: 5 }),
  validator
    .check('password', 'Your password must be at least 8 characters long.')
    .isLength({ min: 8 }),
  validator
    .check(
      'passwordConfirmation',
      'The password confirmation must match your password.'
    )
    .custom((input, meta) => input === meta.req.body.password),

  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({
        message: 'Failed to sign up. Check errors.',
        errors: errors.errors,
      });
    } else {
      createUserWithEmailAndPassword(
        req.app.auth,
        req.body.username,
        req.body.password
      )
        .then((userCredential) => {
          req.app.admin
            .auth()
            .createCustomToken(userCredential.user.uid)
            .then((token) => {
              res.json({ token });
            });
        })
        .catch((err) => {
          console.error('error ' + err);
          next(err);
        });
    }
  },
];

module.exports.authCheckGET = function (req, res, next) {
  if (res.locals.currentUser) {
    res.json({ message: 'Authorized.', authorized: true });
  } else {
    res.json({ message: 'Unauthorized.', authorized: false });
  }
};

module.exports.songsGET = async function (req, res, next) {
  const songKeys = Object.keys(req.app.locals.songs);
  const songs = songKeys.map(
    (key) =>
      new Promise(async (resolve, reject) => {
        const song = await req.app.locals.songs[key];

        const tagsSimplified = {
          title: song.tags.title,
          artist: song.tags.artist,
          trackNumber: song.tags.trackNumber,
          album: song.tags.album,
          genre: song.tags.genre,
          year: song.tags.year,
        };

        resolve({ tags: tagsSimplified, path: song.path, md5: song.md5 });
      })
  );

  Promise.all(songs)
    .then((songs) => res.json({ message: "Here's the songs:", songs }))
    .catch((err) => next(err));
};

module.exports.queueGET = function (req, res, next) {
  const queueOfPaths = req.app.locals.queues[req.app.locals.queuesIndex];
  const songQueue = queueOfPaths.map((path) => req.app.locals.songs[path]);
  Promise.all(songQueue)
    .then((songs) => {
      const md5Queue = songs.map((val) => val.md5);
      res.json({
        message: "Here's the queue:",
        queue: md5Queue,
      });
    })
    .catch((err) => next(err));
};

module.exports.queuePOST = function (req, res, next) {
  const allMD5sExist = [];
  req.body.queue.forEach((songMD5) => {
    allMD5sExist.push(
      new Promise(async (resolve, reject) => {
        const songPath = await req.app.locals.md5ToFPath.get(songMD5);
        if (songPath) resolve(songPath);
        else reject(false);
      })
    );
  });
  Promise.all(allMD5sExist)
    .then((queue) => {
      const songs = {};
      queue.forEach((songPath) => {
        songs[songPath] = req.app.locals.songs[songPath];
      });
      clearInterval(req.app.locals.advanceTimestamp);
      req.app.locals.timestamp = 0;
      afterEnumeration(req.app, songs).catch((err) => console.error(err));

      req.app.locals.timestamp = 0;
    })
    .then(() => {
      //req.app.wss.clients.forEach((client) => client.send('reset'));
    })
    .catch((songs) => console.error('fail', songs));

  res.json({ message: 'Set the queue!', queue: req.body.queue });
};

module.exports.playpauseGET = function (req, res, next) {
  controlPausePlay(req.app);
  res.json({
    message: 'Successfully ' + req.app.locals.status.toString() + ' the song!',
  });
};

module.exports.nextGET = function (req, res, next) {
  controlGotoNextSong(req.app);
  res.json({ message: 'Successfully went to next song!' });
};

module.exports.prevGET = function (req, res, next) {
  controlGotoPrevSong(req.app);
  res.json({ message: 'Successfully went to previous song! ' });
};

module.exports.timePOST = function (req, res, next) {
  const time = Number.parseInt(req.body.time);
  req.app.locals.timestamp = time;
  const message = 'newTime: ' + time;
  req.app.wss.clients.forEach((client) => client.send(message));
  res.json({
    message: 'Successfully set the server to ' + time + ' milliseconds.',
  });
};
