const setupQueue = require('./setupQueue');
const status = require('../enums/status');

module.exports = function (app, songs) {
  app.locals.songs = songs;

  setupQueue(app.locals.songs)
    .then((queue) => {
      app.locals.currentQueue = queue.slice(0);
      app.locals.queues.push(queue.slice(0));
      app.locals.queuesIndex = 0;
      app.locals.lastTimeStamp = new Date();
      app.locals.timestamp = 0;
      app.locals.status = status.PLAYING;
      app.locals.playedSongs = 0;
      setTimeout(
        setInterval.bind(this, app.advanceTimestamp.bind(this, app), 10),
        1000
      );
    })
    .catch((err) => {
      return console.error(err);
    });
};
