var express = require('express'),
    router = express.Router();

router.get('/',function(req,res){
    res.end('Welcome to CRLFilter app!');
});

router.get('/filter',function(req,res){});

module.exports = router;
