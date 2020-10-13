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

router.post(
  '/queue',
  passport.authenticate('jwt', { session: false }),
  musicController.queuePOST
);

router.get(
  '/playpause',
  passport.authenticate('jwt', { session: false }),
  musicController.playpauseGET
);

router.get(
  '/next',
  passport.authenticate('jwt', { session: false }),
  musicController.nextGET
);

router.get(
  '/prev',
  passport.authenticate('jwt', { session: false }),
  musicController.prevGET
);

router.post(
  '/time',
  passport.authenticate('jwt', { session: false }),
  musicController.timePOST
);

module.exports = router;
