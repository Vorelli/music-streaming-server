const status = require('../enums/status');

module.exports = function controlPausePlay(app) {
  app.locals.status =
    app.locals.status === status.PLAYING ? status.PAUSED : status.PLAYING;
  app.wss.clients.forEach((client) => {
    client.send(app.locals.status.toString());
  });
};
