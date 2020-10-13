module.exports = function (app, newTime) {
  app.locals.timestamp = newTime;
  app.wss.clients.forEach((ws) => ws.send('newTime: ' + newTime));
};
