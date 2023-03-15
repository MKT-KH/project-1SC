const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const User = require("./models/user");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLINET_SECRET,
      callbackURL: process.env.CALL_BACK_URL,
      scope: ["email", "profile"],
    },
    (accessToken, refreshToken, profile, done) => {
      User.findOne({ email: profile.emails[0].value })
        .then((user) => {
          if (user) {
            return done(null, user);
          }

          const user2 = new User({
            name: profile.name.givenName,
            email: profile.emails[0].value,
            verify: true,
          });
          return user2.save().then((result) => {
            done(null, user2);
          });
        })
        .catch((err) => {
          console.log(err);
        });
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

module.exports = passport;
