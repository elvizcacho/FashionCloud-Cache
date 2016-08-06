var fs = require('fs');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var uid = require('uid-safe');
var config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'))[process.env.APP_ENV || 'local'];

var preCreate = function(next) {
	var self = this;
	if (!self.isNew) return next();
	self.model('Cache').count({}, function(err, count) { //FIFO Queue
		if (count + 1 > config.cache.maxNumberOfDocuments) { //override oldest document
			self.model('Cache')
				.findOne({}, {
					_id: 1
				})
				.sort({
					created: 1
				}).exec(function(err, cache) {
					self.isNew = false;
					self._id = cache._id;
					self.created = new Date();
					next();
				});
		} else {
			next();
		}
	});
};


//Cache
var CacheSchema = new Schema({
	key: {
		type: String,
		trim: true,
		index: true
	},
	ttl: {
		type: Number,
		default: 86400 //one day 
	},
	payload: {
		type: String,
		default: uid.sync(18) //generates a random String
	},
	created: {
		type: Date,
		default: Date.now,
		index: true
	}
}, {
	collection: 'cache'
});

CacheSchema.pre('save', preCreate);

module.exports = mongoose.model('Cache', CacheSchema);
