const validator = require('express-validator');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { v5 } = require('uuid');
const bcrypt = require('bcrypt');
const { pool } = require('../middleware/passport');
const formidable = require('formidable');
const controlPausePlay = require('../helpers/controlPausePlay');
const controlGotoNextSong = require('../helpers/controlGotoNextSong');
const controlGotoPrevSong = require('../helpers/controlGotoPrevSong');
const controlAdjustTime = require('../helpers/controlAdjustTime');

module.exports.indexGET = function (req, res, next) {
  res.json({
    message: `
    Welcome to the music streaming server controls section.
    Below is a list of commands used to control the server.
    [X][ ] GET  at /control            - Controls the server. Returns list of commands to be used to control server.
    [X][ ] POST at /control/login      - Returns a login token for use by the music-streaming-controller.
    [X][ ] POST at /control/signup     - Sign up with the email, password and password confirmation in the reqest body. Returns a token if successful.
    [X][*] GET  at /control/authCheck  - Returns if token is authorized.
    [X][*] GET  at /control/songs      - Returns all of the songs the server can play.
    [X][*] GET  at /control/queue      - Returns the currently playing queue if authorized by token.
    [ ][*] POST at /control/queue      - Sets the currently playing queue.
    [X][*] GET  at /control/playpause  - Plays/pauses current song.
    [X][*] GET  at /control/next       - Skips the current song and starts playing the next song.
    [X][*] GET  at /control/prev       - Goes to previous song.
    [X][*] POST at /control/time       - Controls the time of the currently played song.
    * - Designates which actions require authorization.
    X - Designates which actions have been coded (DEVELOPMENT)
    `
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
    console.log(req.body);

    req.app.passport.authenticate(
      'local',
      { session: false },
      (err, user, info) => {
        if (err || !user) {
          console.error(err, user);
        } else {
          req.login(user, { session: false }, (err) => {
            if (err) res.json({ err });
            else {
              const token = '' + jwt.sign(user, process.env.SECRET);
              return res.json({ user, token });
            }
          });
        }
      }
    )(req, res);

    if (!errors.isEmpty()) {
      res
        .status(400)
        .json({ message: 'Failed to authenticate. Check errors.', errors });
    }
  }
];

module.exports.signupPOST = [
  validator.body('*').escape(),

  validator
    .check('username', 'You must enter a valid email.')
    .isEmail()
    .isLength({ min: 5 })
    .custom(async (input, meta) => {
      const checkIfUserExistsQuery = `
      SELECT *
      FROM users
      WHERE username=($1)`;
      const value = await pool.query(checkIfUserExistsQuery, [input]);

      console.log(input, value.rowCount, value.rowCount > 0);
      if (value.rowCount > 0) {
        console.log('throwing error');
        throw new Error('Email already exists. Try to login.');
      }
      return true;
    })
    .withMessage('Woopsie'),
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
        errors: errors.errors
      });
    } else {
      const addUserQuery = `
      INSERT INTO users
      (user_id, username)
      VALUES ($1, $2);`;
      const addPasswordQuery = `
      INSERT INTO user_passes
      (user_id, password_hash)
      VALUES ($1, $2);`;

      const userId = v5(req.body.username, process.env.SECRETUUID);
      const addUserValues = [userId, req.body.username];
      const addPasswordValues = [
        userId,
        bcrypt.hashSync(req.body.password, 10)
      ];

      pool.connect((err, client, done) => {
        if (err) return next(err);
        else {
          const addUserResult = client.query(addUserQuery, addUserValues);
          addUserResult.then((value) => {
            if (value.rowCount > 0) {
              const addPasswordResult = client.query(
                addPasswordQuery,
                addPasswordValues
              );
              addPasswordResult.then((value) => {
                console.log('acutally going next');
                next();
              });

              addPasswordResult.catch((err) => next(err));
            }
          });

          addUserResult.catch((err) => next(err));

          addUserResult.finally(() => done());
        }
      });
    }
  },

  (req, res, next) => {
    req.app.passport.authenticate(
      'local',
      { session: false },
      (err, user, info) => {
        if (err || !user) {
          res.status(400).json({ message: 'Something is not right.' });
        } else {
          req.login(user, { session: false }, (err) => {
            if (err) next(err);
            else {
              const token = jwt.sign(user, process.env.SECRET);
              res.json({ message: 'Successfully created user!', token });
            }
          });
        }
      }
    )(req, res, next);
  }
];

module.exports.authCheckGET = function (req, res, next) {
  if (res.locals.currentUser) {
    res.json({ message: 'Authorized.', authorized: true });
  } else {
    res.json({ message: 'Unauthorized.', authorized: false });
  }
};

module.exports.songsGET = async function (req, res, next) {
  const songs = [];
  const songKeys = Object.keys(req.app.locals.songs);
  songKeys.forEach(async (key, index) => {
    const song = await req.app.locals.songs[key];
    const tagsWithoutImage = Object.assign({}, song.tags);
    tagsWithoutImage.image = undefined;

    const tagsSimplified = {
      title: song.tags.title,
      artist: song.tags.artist,
      trackNumber: song.tags.trackNumber,
      album: song.tags.album,
      genre: song.tags.genre,
      year: song.tags.year
    };

    songs.push({
      tags: tagsSimplified,
      path: song.path,
      md5: song.md5
    });

    if (index + 1 === songKeys.length) {
      res.json({ message: "Here's the songs:", songs });
    }
  });
};

module.exports.queueGET = function (req, res, next) {
  const queueOfPaths = req.app.locals.queues[req.app.locals.queuesIndex];
  const songQueue = queueOfPaths.map((path) => req.app.locals.songs[path]);
  Promise.all(songQueue)
    .then((songs) => {
      const md5Queue = songs.map((val) => val.md5);
      res.json({
        message: "Here's the queue:",
        queue: md5Queue
      });
    })
    .catch((err) => next(err));
};

module.exports.queuePOST = function (req, res, next) {
  res.json({ message: 'Set the queue!' });
};

module.exports.playpauseGET = function (req, res, next) {
  controlPausePlay(req.app);
  res.json({
    message: 'Successfully ' + req.app.locals.status.toString() + ' the song!'
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
  // get time from req.... then give it to controlAdjustTime]
  const time = Number.parseInt(req.body.time);
  console.log(req.body);
  controlAdjustTime(req.app, time);
  res.json({
    message: 'Successfully set the server to ' + time + ' milliseconds.'
  });
};
