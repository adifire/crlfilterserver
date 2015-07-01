var CronJob = require('cron').CronJob,
    config = require('./config'),
    app = require('./lib/app'),
    MongoDBHelper = require('./lib/mongodbhelper'),
    filtergen = require('./lib/filter_gen'),
    filter_diff = require('./lib/filter_diff');

const datastoreurl = config.mongodb.url;

/*var datastore = new MongoDBHelper(undefined,function(err) {
    if (err) {
        console.err("Cannot connect to mongodb, error:" + err);
        process.exit(1);
    }
    //exec_server();
});*/

var server = new app(config);

var filtergencron = function() {
    console.log('Starting job');
    var datastore = new MongoDBHelper(datastoreurl,function(err) {
        if (err) return console.log(err);
        var date = new Date();
        date = date.getUTCDate() + ' ' + date.getUTCMonth() + 
                ' ' + date.getUTCFullYear();
        filtergen.generateFilterDummy(datastore,date,'./test/serials_up',function(err,totalInserted) {
            if (err) return console.log(err);
            console.log('Inserted %d serials',totalInserted);
        });
    });
};

var job = new CronJob({
    cronTime: '00 */1 * * * *',
    onTick: filtergencron,
    start: true,
    timeZone: 'UTC'
});

//job.start();
server.start();

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
