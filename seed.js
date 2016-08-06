var models = require('./models');
var async = require('async');

console.log('Seeding db ...');


models.Cache.remove({}).exec(function(err) {
	console.log('database seeded');
});
