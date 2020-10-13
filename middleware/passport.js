const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JWTStrategy = require('passport-jwt').Strategy;
const extractJWT = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const connectionSettings = {
  database: process.env.PGDATABASE || 'music_streaming',
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER || 'NodeUser',
  password: process.env.PGPASSWORD || 'Password123!'
};

const pool = new Pool(
  process.env.PGCONNECTIONSTRING
    ? { connectionString: process.env.PGCONNECTIONSTRING }
    : connectionSettings
);

passport.use(
  'local',
  new LocalStrategy((username, password, done) => {
    const findUserQuery = `
    SELECT users.user_id, username, password_hash
    FROM users
    INNER JOIN user_passes ON users.user_id=user_passes.user_id
    WHERE username=($1)`;
    console.log(username);
    const findUserResult = pool.query(findUserQuery, [username]);
    findUserResult.then((response) => {
      const userFound = response.rowCount > 0;
      const hash = response.rows[0].password_hash;
      const passwordMatches = bcrypt.compareSync(password, hash);
      // get rid of password hash ASA we're done using it!!!!
      response.rows[0].password_hash = undefined;

      done(
        userFound && passwordMatches
          ? false
          : new Error('Unknown email/password'),
        userFound && passwordMatches ? response.rows[0] : null,
        { message: 'Email or password is incorrect.' }
      );
    });

    findUserResult.catch((err) => done(err));
  })
);

passport.use(
  'jwt',
  new JWTStrategy(
    {
      jwtFromRequest: extractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.SECRET
    },
    (jwtPayload, done) => {
      const findUserQuery = `
      SELECT * FROM users
      WHERE user_id=($1);`;
      const findUserResponse = pool.query(findUserQuery, [jwtPayload.user_id]);

      findUserResponse.then((result) => done(null, result));
      findUserResponse.catch((err) => done(err));
    }
  )
);

module.exports = { passport, pool };
