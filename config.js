var config = {};

config.redis = {};
config.mongodb = {};
config.web = {};
config.cronjob = {};

config.redis.port = 6379;
config.redis.host = '127.0.0.1';
config.mongodb.url = 'mongodb://localhost:27017/crlfilter';
config.mongodb.filter_collection = 'filter';
config.web.port = process.env.WEB_PORT || 3130;
config.web.host = '127.0.0.1';
config.cronjob.cronTime = '00 */1 * * * *';


module.exports = config;
