const status = require('../enums/status');

module.exports = async function (app) {
  const currentTimeStamp = new Date();
  const currentSongKey = app.locals.currentQueue[0];
  const currentSong = await app.locals.songs[currentSongKey];
  const duration = currentSong.duration;

  if (app.locals.status === status.PLAYING) {
    app.locals.timestamp += currentTimeStamp - app.locals.lastTimeStamp;
  }

  if (app.locals.currentQueue.length > 0 && app.locals.timestamp >= duration) {
    app.gotoNextSong(app);
  }
  app.locals.lastTimeStamp = currentTimeStamp;
};
