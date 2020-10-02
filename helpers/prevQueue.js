module.exports = function prevQueue(app) {
  if (app.locals.queuesIndex <= 0) {
    const prevQueue = app.locals.queues[0].slice(0);
    const lenOfRandom =
      app.locals.playedSongs === 0 ? prevQueue.length : app.locals.playedSongs;
    const randomPos = Math.floor(Math.random() * lenOfRandom);
    const randomIndex =
      app.locals.playedSongs !== 0
        ? prevQueue.length - app.locals.playedSongs + randomPos
        : randomPos;
    const songComingToFront = prevQueue.splice(randomIndex, 1);
    prevQueue.splice(0, 0, songComingToFront[0]);
    app.locals.queues.unshift(prevQueue);
    app.locals.queuesIndex++;
  }
  return app.locals.queues[app.locals.queuesIndex - 1];
};
