module.exports.index = function (req, res, next) {
  res.json({
    message:
      'Welcome to this music streaming server! GET at /commands to see a list of commands!',
  });
};

module.exports.timestamp = async function (req, res, next) {
  const songKey = req.app.locals.queues[req.app.locals.queuesIndex][0];
  const song = await req.app.locals.songs[songKey];
  const duration = song.duration;

  res.json({
    timestamp: req.app.locals.timestamp,
    message: 'Currently ' + req.app.locals.status,
    duration,
  });
};

module.exports.commands = function (req, res, next) {
  res.json({
    message: `
    Current commands: 
    [X][ ] GET  at /                   - The welcome message.
    [X][ ] GET  at /commands           - Returns this list of commands.
    [X][ ] GET  at /timestamp          - Returns the current time of the song being played.
    [X][ ] GET  at /currentSong        - Returns the song currently being played and its position.
    [X][ ] GET  at /currentSongInfo    - Returns the songs currently being played's info.
    [X][ ] GET  at /nextSong           - The next song that's going to be played.
    [X][ ] GET  at /nextSongInfo       - Returns the song that's going to be played next's info.
    [X][ ] GET  at /nextSongDuration   - Returns the next song's duration.
    [X][ ] GET  at /prevSong           - Returns the song previous in the queue.
    [X][ ] GET  at /prevSongInfo       - Returns the previous song in the queue's info.
    [X][ ] GET  at /control            - Controls the server. Returns list of commands to be used to control server.
    [X][ ] POST at /control/login      - Returns a login token for use by the music-streaming-controller.
    [X][ ] POST at /control/signup     - Sign up with the email, password and password confirmation in the request body. Returns a token if successful.
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
    `,
  });
};

module.exports.currentSong = async function (req, res, next) {
  res.sendFile(
    await req.app.locals.queues[req.app.locals.queuesIndex][0],
    (err) => next(err)
  );
};

module.exports.currentSongInfo = async function (req, res, next) {
  res.json(
    await req.app.locals.songs[
      req.app.locals.queues[req.app.locals.queuesIndex][0]
    ]
  );
};

module.exports.nextSong = async function (req, res, next) {
  res.sendFile(await req.app.nextQueue(req.app)[0], (err) => next(err));
};

module.exports.nextSongInfo = async function (req, res, next) {
  res.json(await req.app.locals.songs[req.app.nextQueue(req.app)[0]]);
};

module.exports.prevSong = async function (req, res, next) {
  res.sendFile(await req.app.prevQueue(req.app)[0], (err) => next(err));
};

module.exports.prevSongInfo = async function (req, res, next) {
  res.json(await req.app.locals.songs[req.app.prevQueue(req.app)[0]]);
};
