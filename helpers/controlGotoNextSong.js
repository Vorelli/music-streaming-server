module.exports = function (app) {
  app.wss.clients.forEach((ws) => ws.send('next'));
  app.locals.playedSongs++;
  const nextQueue = app.nextQueue(app);
  if (app.locals.queues.length > 1000) {
    app.locals.queues.shift();
    app.locals.queuesIndex--;
  }
  app.locals.currentQueue = nextQueue.slice(0);
  app.locals.queuesIndex++;
  app.locals.timestamp = 0;
  if (app.locals.playedSongs >= app.locals.currentQueue.length - 1) {
    app.locals.playedSongs = 0;
  }
};
