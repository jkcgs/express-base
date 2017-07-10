const express = require('express');
let router = express.Router();

router.get('/', function(req, res, next) {
    res.render('index');
});

router.get('/errortest', function(req, res, next) {
    res.render('yare_yare_daze');
});

module.exports = router;