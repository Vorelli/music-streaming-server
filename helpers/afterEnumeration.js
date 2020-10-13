const setupQueue = require('./setupQueue');
const status = require('../enums/status');

module.exports = function (app, songs) {
  const setupQueueRes = setupQueue(songs);
  return new Promise((resolve, reject) => {
    setupQueueRes.then((queue) => {
      app.locals.currentQueue = queue.slice(0);
      app.locals.queues.push(queue.slice(0));
      app.locals.queuesIndex = 0;
      app.locals.lastTimeStamp = new Date();
      app.locals.timestamp = 0;
      app.locals.status = status.PLAYING;
      app.locals.playedSongs = 0;
      setInterval(app.advanceTimestamp.bind(this, app), 10);
      resolve();
    });

    setupQueueRes.catch((err) => {
      reject(err);
    });
  });
};
