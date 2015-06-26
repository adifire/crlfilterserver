
/*
exports.connectRedis = function() {
    var client = redis.createClient();
    client.on('connect',function() {
        console.log('Connected to Redis');
    });

    client.set('filter_type','bloom filter');
};
*/

exports.generateDiff = function(filterstore,diffstore,olddate,type,callback) {
    var currentfilter = filterstore.getCurrentFilter().filters[type],
        oldfilter = filterstore.getFilter(olddate).filters[type];

};
