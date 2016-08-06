var mongoose = require('mongoose');
var Schema = mongoose.Schema;

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

	}
}, {
	collection: 'cache'
});

module.exports = mongoose.model('Cache', CacheSchema);
