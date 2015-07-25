var CronJob = require('cron').CronJob,
    utils = require('./lib/utils'),
    config = require('./config'),
    app = require('./lib/app'),
    MongoDBHelper = require('./lib/mongodbhelper'),
    preloadFilters = require('./lib/preload_filters'),
    filtergen = require('./lib/filter_gen');

var datastoreurl = config.mongodb.url;

var server = new app(config);

/*
 * for prep
 */

var filterprep = function() {
    console.log('Preloading filters');
    var datastore = new MongoDBHelper(datastoreurl,function(err) {
        if (err) {
            return console.log(err);
        }
        preloadFilters(config,datastore);
    });
};

var filtergencron = function() {
    console.log('Starting job');
    var datastore = new MongoDBHelper(datastoreurl,function(err) {
        if (err) {
            return console.log(err);
        }
        var date = utils.getFormattedDate();
        filtergen.generateFilterDummy(datastore,date,'./test/serials_up',true,function(err,totalInserted) {
            if (err) return console.log(err);
            console.log('Inserted %d serials',totalInserted);
        });
    });
};

var job = new CronJob({
    cronTime: '00 */1 * * * *',
    onTick: filtergencron,
    start: false,
    timeZone: 'UTC'
});

if (config.preload) {
    filterprep();
}

//job.start();
server.start();

/*
function exec_server() {
    var date = utils.getFormattedDate();
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
*/
