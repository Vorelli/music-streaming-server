module.exports = function setupQueue(songs) {
  const queue = [];
  const songsKeys = Object.keys(songs);

  for (var i = 0; i < songsKeys.length; i++) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    queue.splice(randomIndex, 0, songsKeys[i]);
  }

  return Promise.resolve(queue);
};
