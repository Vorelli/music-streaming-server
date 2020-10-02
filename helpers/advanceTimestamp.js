const status = require('../enums/status');

module.exports = function (app) {
  const currentTimeStamp = new Date();
  if (app.locals.status === status.PLAYING) {
    app.locals.timestamp += currentTimeStamp - app.locals.lastTimeStamp;
  }
  if (
    app.locals.currentQueue.length > 0 &&
    app.locals.timestamp >=
      app.locals.songs[app.locals.currentQueue[0]].duration
  ) {
    app.gotoNextSong(app);
  }
  app.locals.lastTimeStamp = currentTimeStamp;
};
