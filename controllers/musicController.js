module.exports.index = function (req, res, next) {
  res.json({
    message: `
    Welcome to the music streaming server controls section.
    Below is a list of commands used to control the server.
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
