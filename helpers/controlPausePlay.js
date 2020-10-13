const status = require('../enums/status');

function controlPlayPause(app) {
  app.locals.status =
    app.locals.status === status.PLAYING ? status.PAUSED : status.PLAYING;
  app.wss.clients.forEach((client) => {
    client.send(app.locals.status.toString());
  });
}

module.exports = controlPlayPause;
