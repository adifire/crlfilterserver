var redis = require('redis');
const day = 60*60*24;

function RedisStore(host,port,options) {
    var host = host || '127.0.0.1',
        port = port || 6379;
    this.client = redis.createClient(port,host,options);

    this._quit = function() {
        this.client.quit();
    };
}

RedisStore.prototype.storeDiff = function(curdate,olddate,type,diff,callback) {
    var client = this.client;
    var output = outputgen(callback);
    var key = 'date:'+curdate;

    var hset = function(callback_) {
        client.hset([key,olddate+':'+type,JSON.stringify(diff)],callback_);
    };
    var expireFun = function() {
        client.expire(key,3*day,output);
    };

    client.exists(key,function(err,res) {
        if (err) return output(err);
        var setExpire = (res === 1) && expireFun || output;
        client.set('current',key);
        client.hset(setExpire);
    });
};

RedisStore.prototype.getDiff = function(curdate,olddate,type,callback) {
    var output = outputgen(callback);
    var client = this.client;

    client.hget('date:' + curdate,olddate + ':' + type,output);
};

// TODO: Might need this method each time a change happens during cron job
RedisStore.prototype.copyValues = function(){};
    
var outputgen = function(callback) {
    return function(err,res) {
        if (callback) return callback(err,res);
    };
};

module.exports.RedisStore = RedisStore;
