const fs = require('fs');
const path = require('path');
const md5File = require('md5-file');
const mp3Duration = require('mp3-duration');
const nodeId3 = require('node-id3');
const { bytesToBase64 } = require('byte-base64');
const sharp = require('sharp');

module.exports = function enumerateMusic(app) {
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
    addFilesToList(songs, musicFiles, musicFilesDirectory, app)
      .then(() => {
        console.log(
          Object.keys(songs).length + ' songs have been found and processed!'
        );
        resolve(songs);
      })
      .catch((err) => reject(err));
  });
};

async function addFilesToList(songs, musicFiles, musicFilesDirectory, app) {
  const directoryPromises = [];
  const filePromises = [];
  const md5ToFPath = new Map();

  return new Promise((resolve, reject) => {
    const mp3FileRegex = /\.mp3$/;
    musicFiles.forEach(async (musicFile, index) => {
      const fPath = path.join(musicFilesDirectory, musicFile);
      const stats = fs.lstatSync(fPath);
      if (stats.isDirectory() || stats.isSymbolicLink()) {
        const files = fs.readdirSync(fPath);
        directoryPromises.push(addFilesToList(songs, files, fPath, app));
      } else if (stats.isFile() && mp3FileRegex.test(fPath)) {
        songs[fPath] = new Promise((resolve, reject) => {
          const result = {};
          let relativePath = path.relative(
            path.resolve(__dirname, 'public'),
            fPath
          );
          relativePath = relativePath.replace(/\.\.\\/g, '');
          relativePath = relativePath.replace(/public\\/, '');
          console.log(relativePath);
          result.path = relativePath;
          const thisFilePromises = [];

          const md5 = md5File(fPath);
          thisFilePromises.push(md5);
          md5.then((md5) => {
            result.md5 = md5;
            md5ToFPath.set(md5, fPath);
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
                formatTags(tags)
                  .then((val) => {
                    result.tags = val;
                    resolve(tags);
                  })
                  .catch((err) => reject(err));
              }
            });
          });
          thisFilePromises.push(nodeId3Promise);

          Promise.all(thisFilePromises)
            .then((_) => {
              app.locals.md5ToFPath = md5ToFPath;
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
  return new Promise((resolve, reject) => {
    const newTags = tags;
    newTags.year =
      tags.raw.TDOR ||
      tags.raw.TORY ||
      tags.raw.TYER ||
      tags.raw.TDRC ||
      'Unknown Year';
    newTags.album = tags.album || 'Unknown Album';
    newTags.title = tags.title || 'Unknown Song Name';
    newTags.artist = tags.artist || 'Unknown Artist';
    newTags.genre = tags.genre || 'Unknown Genre';
    if (tags.image) {
      // up to a 90% improvement (in size) depending on the song
      sharp(tags.image.imageBuffer)
        .resize(164)
        .jpeg()
        .toBuffer()
        .then((buffer) => {
          const base64Prefix = 'data:image/' + 'jpeg' + ';base64,';
          const imageByte64 = bytesToBase64(buffer);
          const base64String = base64Prefix + imageByte64;
          newTags.image = base64String;
          resolve(newTags);
        })
        .catch((err) => reject(err));
    } else {
      resolve(newTags);
    }
    return newTags;
  });
}
