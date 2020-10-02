module.exports = function controlGotoPrevSong(app) {
  app.wss.clients.forEach((ws) => ws.send('prev'));
  app.locals.queuesIndex--;
  app.locals.playedSongs--;
  if (app.locals.playedSongs < 0) {
    app.locals.playedSongs = app.locals.queue.length - 1;
  }
  app.locals.timestamp = 0;
  app.locals.currentQueue = app.prevQueue(app).slice(0);
  if (app.locals.queues.length > 1000) {
    app.locals.queues.pop();
  }
};
