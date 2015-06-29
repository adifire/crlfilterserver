var express = require('express'),
    path = require('path'),
    //favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    routes = require('../routes/index');

function Server() {

    this.app = express();
    var app = this.app;
    app.set('view engine','jade');
    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    //app.use(cookieParser());
        
    app.use('/',routes);
    app.use(function(req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    if (app.get('env') === 'development') {
        app.use(function(err, req, res, next) {
            console.log(err);
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
        console.log(err);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });

    
};

Server.prototype.start = function(address,port) {
    var self = this;
    var address = address || undefined,
        port = port || 3130;

    this.server = this.app.listen(port,function() {
        var host = self.server.address().address;
        var port = self.server.address().port;
        console.log('Server started on http://%s:%s',host,port);
    }); 
};

module.exports = Server;
