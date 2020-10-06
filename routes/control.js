const express = require('express');
const router = express.Router();
const musicController = require('../controllers/musicController');
const { passport } = require('../middleware/passport');

router.get('/', musicController.indexGET);

router.post('/login', musicController.loginPOST);

router.post('/signup', musicController.signupPOST);

router.get('/authCheck', musicController.authCheckGET);

router.get(
  '/songs',
  passport.authenticate('jwt', { session: false }),
  musicController.songsGET
);

router.get(
  '/queue',
  passport.authenticate('jwt', { session: false }),
  musicController.queueGET
);

router.post('/queue', musicController.queuePOST);

router.get('/playpause', musicController.playpauseGET);

router.get('/next', musicController.nextGET);

router.get('/prev', musicController.prevGET);

router.post('/time', musicController.timePOST);

module.exports = router;
