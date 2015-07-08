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
exports.generateDiff = function(mongodb,redis,olddate,newdate,type,callback) {
    var callback = utils.handleCallback(callback);
    mongodb.getFilter(newdate,function(err,result) {
        if (err) return callback('Error getting current filter: ' + err);
        //console.log(result);
        var curfilter = JSON.parse(result[0].filters)[type];

        mongodb.getFilter(olddate,function(err,result) {
            if (err) 
                return callback(new Error(
                'Error retrieving old filter for date ' + olddate + 
                ' Error: ' + err));
            if (result.length < 1) 
                return callback(new Error('Error: No filters found for the date ' + olddate));
            //console.log(result);
            var oldfilter = JSON.parse(result[0].filters)[type];
            //console.log(type);
            var diff = checkandgendiff(oldfilter,curfilter);
            redis.storeDiff(newdate,olddate,type,diff);
            callback(undefined,diff);
        });
    });
};

var checkandgendiff = function(oldfilter,newfilter) {
    if (oldfilter.error_rate !== newfilter.error_rate) {
        return console.error('Files not supposed to have different error rate');
    }

    var changes = {};
    if (oldfilter.capacity !== newfilter.capacity) {
        changes['capacity'] = newfilter.capacity;
    }

    if (oldfilter.filter.size !== newfilter.filter.size) {
        changes['filter_size'] = newfilter.filter.size;
    }

    if (oldfilter.filter.slices !== newfilter.filter.slices) {
        changes['filter_slices'] = newfilter.filter.slices;
    }

    var oldbuffer = oldfilter.filter.bitfield.buffer;
        newbuffer = newfilter.filter.bitfield.buffer;

    changes['buffer'] = {};
    for (var i = 0; i < oldbuffer.length; i++) {
        if (oldbuffer[i] !== newbuffer[i]) {
            //console.log(i);
            changes['buffer'][i] = newbuffer[i];
        }
    }

    if (oldbuffer.length < newbuffer.length) {
        for (var i = oldbuffer.length; i < newbuffer.length; i++)
            changes[buffer][i] = newbuffer[i];
    }

    return changes;
};

