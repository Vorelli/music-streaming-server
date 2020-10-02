module.exports = function (app) {
  if (app.locals.queuesIndex === app.locals.queues.length - 1) {
    // simulate the playedSongs going up by one and having
    // to push the currently played song to a random play in the queue
    const nextQueue = app.locals.queues[app.locals.queuesIndex].slice(0);
    const songFinished = nextQueue.shift();
    const randomIndex =
      nextQueue.length - Math.floor(Math.random() * app.locals.playedSongs);
    nextQueue.splice(randomIndex, 0, songFinished);
    app.locals.queues.push(nextQueue);
  }
  return app.locals.queues[app.locals.queuesIndex + 1];
};
