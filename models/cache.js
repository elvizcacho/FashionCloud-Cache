var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Cache
var CacheSchema = new Schema({

}, {
	collection: 'cache'
});

module.exports = mongoose.model('Cache', CacheSchema);
