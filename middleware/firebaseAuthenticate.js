const firebaseAuthenticate = function (req, res, next) {
  if (res.locals.currentUser) {
    next();
  } else {
    res.send(401);
  }
};

module.exports = firebaseAuthenticate;
