const fs = require('fs');
const path = require('path');
const md5File = require('md5-file');
const mp3Duration = require('mp3-duration');
const nodeId3 = require('node-id3');
const { resolve } = require('path');

module.exports = function enumerateMusic() {
  const musicFilesDirectory = path.join(__dirname, '../public');
  const musicFiles = fs.readdirSync(musicFilesDirectory);

  // a song should have all of the following information
  // about itself stored with it:
  // filename (and path)
  // time length
  // metadata
  // MD5

  const songs = {};
  return new Promise((resolve, reject) => {
    addFilesToList(songs, musicFiles, musicFilesDirectory)
      .then(() => {
        resolve(songs);
      })
      .catch((err) => reject(err));
  });
};

async function addFilesToList(songs, musicFiles, musicFilesDirectory) {
  const directoryPromises = [];
  return new Promise((resolve, reject) => {
    musicFiles.forEach((musicFile, index) => {
      const musicFilePath = path.join(musicFilesDirectory, musicFile);
      const stats = fs.lstatSync(musicFilePath);
      if (stats.isDirectory() || stats.isSymbolicLink()) {
        const files = fs.readdirSync(musicFilePath);
        directoryPromises.push(addFilesToList(songs, files, musicFilePath));
      } else if (stats.isFile()) {
        songs[musicFilePath] = { path: musicFilePath };
        const md5 = md5File(musicFilePath);
        md5.then((md5) => {
          songs[musicFilePath].md5 = md5;
        });
        mp3Duration(musicFilePath, (err, duration) => {
          if (err) return reject(err);
          else {
            const durationInMilliseconds = duration * 1000;
            songs[musicFilePath].duration = durationInMilliseconds;
          }
        });
        nodeId3.read(musicFilePath, (err, tags) => {
          if (err) return reject(err);
          else {
            songs[musicFilePath].tags = tags;
          }
        });
      }

      if (index + 1 === musicFiles.length) {
        Promise.all(directoryPromises)
          .then(() => resolve('troll'))
          .catch((err) => reject(err));
      }
    });
  });
}
