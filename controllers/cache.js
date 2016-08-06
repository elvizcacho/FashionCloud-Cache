var models = require('../models');



module.exports.list = function(req, res) {
	models.Cache.find({}).exec((err, keys) => {
		if (err) res.status(400).send(err);
		res.send(keys);
	});
};

module.exports.read = function(req, res) {

};

module.exports.createOrUpdate = function(req, res) {

};


module.exports.deleteOne = function(req, res) {

};


module.exports.deleteAll = function(req, res) {

};
