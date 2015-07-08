var utils = require('../lib/utils');
var path = require('path');
var config = {};
var curpath = process.cwd();
var joinpath = function(loc) { return path.join(curpath,loc); };
var day = 24 * 60 * 60 * 1000; 
var today = new Date();
var prev_day = new Date(today - day);
var day_before = new Date(today - 2*day);
today = utils.getFormattedDate(today);
prev_day = utils.getFormattedDate(prev_day);
day_before = utils.getFormattedDate(day_before);
config.mongodb = {};
config.redis = {};
config.filter = {};
config.filter.test_serials = [
    {'date':day_before,'serial':joinpath('test/serials_1')},
    {'date':prev_day,'serial':joinpath('test/serials_2')},
    {'date':today,'serial':joinpath('test/serials_3')}
];
config.filter.capacity = 100000;
config.mongodb.url = 'mongodb://localhost:27017/testcrlfilter'

module.exports = config;
