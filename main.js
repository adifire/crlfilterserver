var express = require('express'),
    path = require('path'),
    //favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    routes = require('./routes/index'),
    MongoDBHelper = require('./lib/mongodbhelper'),
    filtergen = require('./lib/filter_gen'),
    filter_diff = require('./lib/filter_diff');

//var app = express();

var datastore = new MongoDBHelper(undefined,function(err) {
    if (err) {
        console.err("Cannot connect to mongodb, error:" + err);
        process.exit(1);
    }
    //exec_server();
    start_server();
});


function start_server() {
    var app = express();
    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(cookieParser());
    
    app.use('/',routes);
    app.use(function(req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    if (app.get('env') === 'development') {
        app.use(function(err, req, res, next) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: err
            });
        });
    }

    // production error handler
    // no stacktraces leaked to user
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });

    var server = app.listen(3130,function() {
        var host = server.address().address;
        var port = server.address().port;

        console.log('Server started on http://%s:%s',host,port);
    });
}

function exec_server() {
    var date = new Date();
    date = date.getUTCDate() + ' ' + date.getUTCMonth() + 
            ' ' + date.getUTCFullYear();
    var testfun = function(err,data) {
        console.log('Entering test function');
        if (err) return console.log(err);
        console.log('Checking if filters were added for date:' + date);
        datastore.getFilter(date,'1',function(err,result) {
            if (err) return console.log(err);
            console.log(result);
        });
    };

    filtergen.generateFilterDummy(datastore,date,'./test/serials_1',testfun);
    testfun();
}
