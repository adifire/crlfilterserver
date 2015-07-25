var utils = require('../lib/utils');
/*
exports.connectRedis = function() {
    var client = redis.createClient();
    client.on('connect',function() {
        console.log('Connected to Redis');
    });

    client.set('filter_type','bloom filter');
};
*/
var exports = module.exports;
exports.generateDiff = function(mongodb,redis,olddate,newdate,type,callback) {
    var output = utils.handleCallback(callback);
    console.log('heres new date' + newdate);
    mongodb.getFilter(newdate,function(err,result) {
        if (err) {
            return output('Error getting current filter: ' + err);
        }
        //console.log(result);
        var curfilter = JSON.parse(result[0].filters)[type];

        mongodb.getFilter(olddate,function(err,result) {
            if (err) {
                return output(new Error(
                'Error retrieving old filter for date ' + olddate + 
                ' Error: ' + err));
            }
            if (result.length < 1) {
                return output(new Error('Error: No filters found for the date ' + olddate));
            }
            //console.log(result);
            var oldfilter = JSON.parse(result[0].filters)[type];
            //console.log(type);
            var diff = checkandgendiff(oldfilter,curfilter);
            if (diff) {
                redis.storeDiff(newdate,olddate,type,diff);
            }
            output(undefined,diff);
        });
    });
};

exports.generateDiffAlt = function(oldfilter,newfilter) {
    return checkandgendiff(JSON.parse(oldfilter),JSON.parse(newfilter));
};

var checkandgendiff = function(oldfilter,newfilter) {
    console.log(oldfilter);
    console.log(newfilter);

    if (oldfilter.error_rate !== newfilter.error_rate) {
        return console.error('Files not supposed to have different error rate');
    }

    var changes = {};
    if (oldfilter.capacity !== newfilter.capacity) {
        changes.capacity = newfilter.capacity;
    }

    if (oldfilter.count !== newfilter.count) {
        changes.count = newfilter.count;
    }

    if (oldfilter.filter.size !== newfilter.filter.size) {
        changes.filter_size = newfilter.filter.size;
    }

    if (oldfilter.filter.slices !== newfilter.filter.slices) {
        changes.filter_slices = newfilter.filter.slices;
    }

    var oldbuffer = oldfilter.filter.bitfield.buffer.data,
        newbuffer = newfilter.filter.bitfield.buffer.data;

    changes.buffer = {};
    for (var i = 0; i < oldbuffer.length; i++) {
        if (oldbuffer[i] !== newbuffer[i]) {
            //console.log(i);
            changes.buffer[i] = newbuffer[i];
        }
    }

    if (oldbuffer.length < newbuffer.length) {
        for (var i = oldbuffer.length; i < newbuffer.length; i++)
            changes.buffer[i] = newbuffer[i];
    }

    return (changes.length === 0) ? null : changes;
};

