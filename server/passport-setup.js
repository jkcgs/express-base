const passport = require('passport');
const debug = require('debug')('3ds-themes:passport');
const bcrypt = require('bcrypt');
const config = require('../config.json');
const User = require('./models/user');
const Sysadmin = require('./models/sysadmin');

const FacebookTokenStrategy = require('passport-facebook-token');
const TwitterTokenStrategy = require('passport-twitter-token');
const GoogleTokenStrategy = require('passport-google-token').Strategy;
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const LocalStrategy = require('passport-local').Strategy;

let fbConfig = config.authFacebook;
fbConfig.profileFields = ['id', 'emails', 'displayName'];
let fbEnabled = fbConfig.clientID && fbConfig.clientSecret;

let twConfig = config.authTwitter;
twConfig.includeEmail = true;
let twEnabled = twConfig.consumerKey && twConfig.consumerSecret;

let ggConfig = config.authGoogle;
let ggEnabled = ggConfig.clientID && ggConfig.clientSecret;

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id)
        .then((user) => {
            //user.password = null;
            done(null, user);
        })
        .catch((err) => {
            done(err, null);
        });
});

if(fbEnabled) {
    // Configurar Facebook
    passport.use(new FacebookStrategy(fbConfig,
        (token, refresh, profile, done) => {
            loginCallback('sn_facebook_id', profile.id, 'Facebook', done);
        }
    ));
    // Configurar Facebook mediante token
    passport.use(new FacebookTokenStrategy(fbConfig,
        (token, refresh, profile, done) => {
            loginCallback('sn_facebook_id', profile.id, 'Facebook (token)', done);
        }
    ));
}

if(twEnabled) {
    // Configurar Twitter
    passport.use(new TwitterStrategy(twConfig,
        function(token, secret, profile, done) {
            loginCallback('sn_twitter_id', profile.id, 'Twitter', done);
        }
    ));

    passport.use(new TwitterTokenStrategy(twConfig,
        (token, secret, profile, done) => {
            loginCallback('sn_twitter_id', profile.id, 'Twitter (token)', done);
        }
    ));
}

if(ggEnabled) {
    passport.use(new GoogleStrategy(config.authGoogle,
        (token, refresh, profile, done) => {
            loginCallback('sn_google_id', profile.id, 'Google', done);
        }
    ));

    passport.use(new GoogleTokenStrategy(config.authGoogle,
        (token, refresh, profile, done) =>
            loginCallback('sn_google_id', profile.id, 'Google (token)', done)
    ));
}

// Login via email and password
passport.use(new LocalStrategy(
    {
        usernameField: 'email',
        passwordField: 'password'
    },
    function(email, password, done) {
        User.findOne({where: {'email': email}}).then((user) => {
            if(!user) {
                return done(null, false);
            }

            return bcrypt.compare(password, user.password, (err, equal) => {
                if(err) {
                    done(err, null);
                }

                if(equal) {
                    Sysadmin.findOne({userId: user.id}).then((sysadmin) => {
                        debug('Session started via email ' + user.email);
                        //user.password = null;
                        user.isSysAdmin = !!sysadmin;
                        done(null, user);
                    });
                } else {
                    debug('Wrong password for ' + user.email);
                    done(null, false);
                }
            });
            
        })
        .catch((err) => {
            done(err, null);
        });
    }
));

function loginCallback(col, id, method, done) {
    let p = {};
    p[col] = id;
    debug(`Login try via ${method} profile id ${id}`);

    User.findOne({where: p})
    .then((user) => {
        if(!user) {
            debug(`${method} user profile id ${id} not registered`);
            return done(null, false, {id: id});
        }

        Sysadmin.findOne({userId: id}).then((sysadmin) => {
            debug(`Session started via ${method} by ${user.email}`);
            //user.password = null;
            user.isSysAdmin = !!sysadmin;
            done(null, user);
        });
    })
    .catch((err) => {
        done(err, null);
    });
}

module.exports = passport;