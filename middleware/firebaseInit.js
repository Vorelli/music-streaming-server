const { initializeApp } = require('firebase/app');
const {
  getAuth,
  setPersistence,
  inMemoryPersistence,
} = require('firebase/auth');
const admin = require('firebase-admin');

const firebaseInit = function (app) {
  const firebaseConfig = {
    apiKey: 'AIzaSyDw0Y8-BQsSVVTvIRz8_OgqNGeVA1pKZQk',
    authDomain: 'music-streaming-server.firebaseapp.com',
    projectId: 'music-streaming-server',
    storageBucket: 'music-streaming-server.appspot.com',
    messagingSenderId: '92755763035',
    appId: '1:92755763035:web:ed98c4287373e6bd00847e',
  };

  const firebaseAppNonAdmin = initializeApp(firebaseConfig, '[DEFAULT]');
  const adminKey = require('../private/music-streaming-server-firebase-adminsdk-sqa53-ff5cf40004.json');
  const firebaseApp = admin.initializeApp(
    {
      credential: admin.credential.cert(adminKey),
    },
    '[DEFAULT]'
  );

  const auth = getAuth(firebaseAppNonAdmin);
  app.auth = auth;
  app.admin = admin;

  const setting = setPersistence(auth, inMemoryPersistence);
  setting.catch((err) => console.error(err));
};

module.exports = firebaseInit;
