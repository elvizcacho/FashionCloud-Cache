var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var uid = require('uid-safe');

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

module.exports = mongoose.model('Cache', CacheSchema);
