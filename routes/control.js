const express = require('express');
const router = express.Router();
const musicController = require('../controllers/musicController');
const firebaseAuthenticate = require('../middleware/firebaseAuthenticate');

router.get('/', musicController.indexGET);

router.post('/login', musicController.loginPOST);

router.post('/signup', musicController.signupPOST);

router.get('/authCheck', musicController.authCheckGET);

router.get('/songs', firebaseAuthenticate, musicController.songsGET);

router.get('/queue', firebaseAuthenticate, musicController.queueGET);

router.post('/queue', firebaseAuthenticate, musicController.queuePOST);

router.get('/playpause', firebaseAuthenticate, musicController.playpauseGET);

router.get('/next', firebaseAuthenticate, musicController.nextGET);

router.get('/prev', firebaseAuthenticate, musicController.prevGET);

router.post('/time', firebaseAuthenticate, musicController.timePOST);

module.exports = router;
