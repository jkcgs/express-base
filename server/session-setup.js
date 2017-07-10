const SysAdmin = require('./models/sysadmin');
const jwtVerify = require('express-jwt');
const config = require('../config.json');
const User = require('./models/user');

let verif = jwtVerify({
    secret: config.sessionSecret,
    requestProperty: 'auth',
    getToken: function fromHeaderOrQuerystring(req) {
        let auth = req.headers.authorization;
        let cookie = req.cookies.accessToken;

        if (auth && auth.split(' ')[0] === 'Bearer') {
            return auth.split(' ')[1];
        } else if (cookie) {
            return cookie;
        }

        return null;
    }
});

module.exports = {
    jwt: verif,
    setup: sessionSetup,
    logged: isLogged,
    admin: isAdmin
};

function sessionSetup(req, res, next) {
    verif(req, res, function(err) {
        if(err) {
            return next(err);
        }
        
        if(!req.user && req.auth) {
            User.findById(req.auth.id).then((user) => {
                user.password = null;
                req.user = user;
                res.locals.user = req.user;
                next();
            });
        } else {
            res.locals.user = req.user;
            next();
        }        
    });
}

function isLogged(req, res, next) {
    sessionSetup(req, res, function(err) {
        if(err) {
            return next(err);
        }

        if(!req.user) {
            if(req.isJSON()) {
                let e = new Error('Not authorized');
                e.status = 403;
                return next(e);
            } else {
                req.flash('error', 'Not authorized');
                return res.redirect('/login');
            }
        }

        res.locals.user = req.user;
        next();
    });
}

function isAdmin(req, res, next) {
    sessionSetup(req, res, function (err) {
        if (err) {
            return next(err);
        }
        SysAdmin.findOne({ userId: req.user.id }).then((sysadmin) => {
            if (!sysadmin) {
                req.flash('error', 'Not authorized');
                return res.redirect('/login');
            } else {
                next();
            }
        });
    });
}