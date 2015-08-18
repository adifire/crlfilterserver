var async = require('async'),
    fs = require('fs'),
    bloem = require('bloem'),
    utils = require('../lib/utils'),
    filtergen = require('../lib/filter_gen');

module.exports = function (config,mongodb) {
    if (!config.preload.serial_files) {
        if (config.preload.filters) {
            return loadFilters(config,mongodb);    
        }
        return console.log("No files for serial numbers specified");    
    }

    var serial_files = config.preload.serial_files;

    // Assuming they are in the loading order of filters per day
    var len = serial_files.length,
        curdate = new Date(),
        day = 60*60*24*1000;
    serial_files = serial_files.map(function(filename,index) {
        return {
            'name':filename,
            'date':new Date(curdate-(serial_files.length-index-1)*day),
            'current': (index === (len-1))
        };
    });

    async.eachSeries(serial_files,function(info,callback) {
        console.log(info);
        return filtergen.generateFilterDummy(
            mongodb,
            utils.getFormattedDate(new Date(info.date)),
            info.name,
            info.current,
            function(err) {
                if (err) {
                    callback(err);
                }
                console.log('Created filters for date: ' + info.date);
                callback();
            });
    }, function(err, results) {
        if (err) {
            throw err;
        }
        console.log('Done adding files');
    });

};

function loadFilters(config,mongodb) {
    try {
    var filter_files = config.preload.filters;
    var filters = {};
    var temp;
    for (var i in filter_files) {
        console.log('Loading ' + filter_files[i]);
        temp = undefined;
        temp = fs.readFileSync(filter_files[i],'utf-8');
        filters[''+i] = bloem.SafeBloem.destringify(JSON.parse(temp));
    }
    console.log(filters);
    mongodb.storeFilters('current',filters,true,function(err) {
        if (err) {
            return console.log(err);
        }
        console.log('Added filters');
    });
    } catch(err) {
        console.log(err);    
    }
}
//preloadFilters({'preload':{'serial_files':[1,2,3]}});

