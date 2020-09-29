const express = require('express');
const app = express();
const path = require('path');
const indexRouter = require('./routes/index');
const controlRouter = require('./routes/control');
const status = require('./enums/status');
const enumerateMusic = require('./helpers/enumerateMusic');
const setupQueue = require('./helpers/setupQueue');
const morgan = require('morgan');
const http = require('http');

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.use(morgan('dev'));
app.use('/', indexRouter);
app.use('/control', controlRouter);

const enumerateProcess = enumerateMusic();
enumerateProcess.then((songs) => {
  app.locals.songs = songs;
  const queueSetupProcess = setupQueue(app.locals.songs);
  queueSetupProcess.then((queue) => {
    console.log(queue);
    app.locals.queue = queue.slice(0);
    app.locals.queueAfterNextSong = queue.slice(0);
    app.locals.lastTimeStamp = new Date();
    app.locals.timestamp = 0;
    app.locals.status = status.PLAYING;
    app.locals.playedSongs = 0;
    setTimeout(setInterval.bind(this, app.advanceTimestamp, 100), 1000);
  });
  queueSetupProcess.catch((err) => {
    return console.error(err);
  });
});
enumerateProcess.catch((err) => {
  return console.error(err);
});

app.listen(process.env.PORT);

app.advanceTimestamp = function () {
  const currentTimeStamp = new Date();
  if (app.locals.status === status.PLAYING) {
    app.locals.timestamp += currentTimeStamp - app.locals.lastTimeStamp;
  }
  if (
    app.locals.queue.length > 0 &&
    app.locals.timestamp >= app.locals.songs[app.locals.queue[0]].duration
  ) {
    app.gotoNextSong();
  }
  app.locals.lastTimeStamp = currentTimeStamp;
};

app.nextQueue = function () {
  if (app.locals.queueAfterNextSong[0] === app.locals.queue[0]) {
    // simulate the playedSongs going up by one and having
    // to push the currently played song to a random play in the queue
    const songFinished = app.locals.queueAfterNextSong[0];
    app.locals.queueAfterNextSong.shift(); // remove the first element
    const randomIndex =
      app.locals.queueAfterNextSong.length -
      Math.floor(Math.random() * app.locals.playedSongs);
    app.locals.queueAfterNextSong.splice(randomIndex, 0, songFinished);
  }
  return app.locals.queueAfterNextSong;
};

app.gotoNextSong = function () {
  app.locals.playedSongs++;
  app.locals.timestamp = 0;
  app.locals.queue = app.nextQueue();
  if (app.locals.playedSongs >= app.locals.queue.length - 1) {
    app.locals.playedSongs = 0;
  }
};
