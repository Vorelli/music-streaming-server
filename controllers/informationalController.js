module.exports.index = function (req, res, next) {
  res.json({
    message:
      'Welcome to this music streaming server! GET at /commands to see a list of commands!'
  });
};

module.exports.timestamp = function (req, res, next) {
  res.json({
    timestamp: req.app.locals.timestamp,
    duration: req.app.locals.songs[req.app.locals.queue[0]].duration,
    message: 'Currently ' + req.app.locals.status
  });
};

module.exports.commands = function (req, res, next) {
  res.json({
    message: `
    Current commands: 
    [ ] GET  at /                   - The welcome message.
    [ ] GET  at /commands           - Returns this list of commands.
    [ ] GET  at /timestamp          - Returns the current time of the song being played.
    [ ] GET  at /currentSong        - Returns the song currently being played and its position.
    [ ] GET  at /currentSongInfo    - Returns the songs currently being played's info.
    [ ] GET  at /nextSong           - The next song that's going to be played.
    [ ] GET  at /nextSongInfo       - Returns the song that's going to be played next's info.
    [ ] GET  at /control            - Controls the server. Returns list of commands to be used to control server.
    [ ] POST at /control/login      - Returns a login token for use by the music-streaming-controller.
    [*] GET  at /control/queue      - Returns the currently playing queue if authorized by token.
    [*] GET  at /control/playpause  - Plays/pauses current song.
    [*] GET  at /control/next       - Skips the current song and starts playing the next song.
    [*] GET  at /control/prev       - Goes to previous song.
    [*] POST at /control/time       - Controls the time of the currently played song.
    * - Designates which actions require authorization.
    `
  });
};

module.exports.currentSong = function (req, res, next) {
  res.sendFile(req.app.locals.queue[0], (err) => next(err));
};

module.exports.currentSongInfo = function (req, res, next) {
  res.json(req.app.locals.songs[req.app.locals.queue[0]]);
};

module.exports.nextSong = function (req, res, next) {
  res.sendFile(req.app.nextQueue()[0], (err) => next(err));
};

module.exports.nextSongInfo = function (req, res, next) {
  res.json(req.app.locals.songs[req.app.nextQueue()[0]]);
};
