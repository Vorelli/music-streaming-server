const express = require('express');
const router = express.Router();
const informationalController = require('../controllers/informationalController');

router.get('/', informationalController.index);

router.get('/commands', informationalController.commands);

router.get('/timestamp', informationalController.timestamp);

router.get('/currentSong', informationalController.currentSong);

router.get('/currentSongInfo', informationalController.currentSongInfo);

router.get('/nextSong', informationalController.nextSong);

router.get('/nextSongInfo', informationalController.nextSongInfo);

router.get('/prevSong', informationalController.prevSong);

router.get('/prevSongInfo', informationalController.prevSongInfo);

module.exports = router;
