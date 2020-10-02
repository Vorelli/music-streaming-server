const fs = require('fs');
const path = require('path');
const md5File = require('md5-file');
const mp3Duration = require('mp3-duration');
const nodeId3 = require('node-id3');
const { bytesToBase64 } = require('byte-base64');

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
    const mp3FileRegex = /\.mp3$/;
    musicFiles.forEach((musicFile, index) => {
      const fPath = path.join(musicFilesDirectory, musicFile);
      const stats = fs.lstatSync(fPath);
      if (stats.isDirectory() || stats.isSymbolicLink()) {
        const files = fs.readdirSync(fPath);
        directoryPromises.push(addFilesToList(songs, files, fPath));
      } else if (stats.isFile() && mp3FileRegex.test(fPath)) {
        songs[fPath] = { path: fPath };
        md5File(fPath).then((md5) => {
          songs[fPath].md5 = md5;
        });

        mp3Duration(fPath, (err, duration) => {
          if (err) return reject(err);
          const durationInMilliseconds = duration * 1000;
          songs[fPath].duration = durationInMilliseconds;
        });

        nodeId3.read(fPath, (err, tags) => {
          if (err) return reject(err);
          songs[fPath].tags = formatTags(tags);
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
