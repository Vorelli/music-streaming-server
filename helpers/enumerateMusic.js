const fs = require('fs');
const path = require('path');
const md5File = require('md5-file');
const mp3Duration = require('mp3-duration');
const nodeId3 = require('node-id3');
const { bytesToBase64 } = require('byte-base64');
const util = require('util');

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
        console.log('resolving the songs!!!');
        console.log(Object.keys(songs).length);
        resolve(songs);
      })
      .catch((err) => reject(err));
  });
};

async function addFilesToList(songs, musicFiles, musicFilesDirectory) {
  const directoryPromises = [];
  const filePromises = [];

  return new Promise((resolve, reject) => {
    const mp3FileRegex = /\.mp3$/;
    musicFiles.forEach(async (musicFile, index) => {
      const fPath = path.join(musicFilesDirectory, musicFile);
      const stats = fs.lstatSync(fPath);
      if (stats.isDirectory() || stats.isSymbolicLink()) {
        const files = fs.readdirSync(fPath);
        directoryPromises.push(addFilesToList(songs, files, fPath));
      } else if (stats.isFile() && mp3FileRegex.test(fPath)) {
        songs[fPath] = new Promise((resolve, reject) => {
          const result = {};
          result.path = fPath;
          const thisFilePromises = [];

          const md5 = md5File(fPath);
          thisFilePromises.push(md5);
          md5.then((md5) => {
            result.md5 = md5;
          });
          md5.catch((err) => reject(err));

          const mp3DurationRes = new Promise((resolve, reject) => {
            mp3Duration(fPath, (err, duration) => {
              if (err) reject(err);
              result.duration = duration * 1000;
              resolve();
            });
          });
          thisFilePromises.push(mp3DurationRes);

          const nodeId3Promise = new Promise((resolve, reject) => {
            nodeId3.read(fPath, (err, tags) => {
              if (err) reject(err);
              else {
                result.tags = formatTags(tags);
                resolve(tags);
              }
            });
          });
          thisFilePromises.push(nodeId3Promise);

          Promise.all(thisFilePromises)
            .then((_) => {
              /*  */
              resolve(result);
            })
            .catch((err) => reject(err));
        });
        filePromises.push(songs[fPath]);
      }

      if (index + 1 === musicFiles.length) {
        const promises = [...directoryPromises, ...filePromises];
        Promise.all(promises)
          .then(() => {
            console.log('resolving');
            resolve('troll');
          })
          .catch((err) => reject(err));
      }
    });
  });
}

function formatTags(tags) {
  tags.year =
    tags.raw.TDOR ||
    tags.raw.TORY ||
    tags.raw.TYER ||
    tags.raw.TDRC ||
    'Unknown Year';
  tags.album = tags.album || 'Unknown Album';
  tags.title = tags.title || 'Unknown Song Name';
  tags.artist = tags.artist || 'Unknown Artist';
  if (tags.image) {
    const base64Prefix = 'data:image/' + tags.image.mime + ';base64,';
    const imageByte64 = bytesToBase64(tags.image.imageBuffer);
    const base64String = base64Prefix + imageByte64;
    tags.image = base64String;
  }
  tags.raw = undefined;
  return tags;
}
