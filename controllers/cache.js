var models = require('../models');
var async = require('async');
var uid = require('uid-safe');


module.exports.list = function(req, res) {
	models.Cache.find({}).exec(function(err, keys) {
		if (err) return res.status(400).send(err);
		res.send(keys);
	});
};

module.exports.read = function(req, res) {
	async.waterfall([

		function(cb) {
			models.Cache.findOne({
				key: req.params.key
			}).exec(cb);
		},
		function(cache, cb) {
			if (cache) {
				if (Date.parse(cache.modified) + (cache.ttl * 1000) < Date.now()) { // Cache is not alive anymore
					cache.payload = uid.sync(18);
					cache.save();
					cb(null, {
						message: 'Cache miss',
						data: cache.payload
					});
					console.log('Cache miss');
				} else {
					console.log('Cache hit');
					cache.modified = new Date();
					cache.save();
					cb(null, {
						message: 'Cache hit',
						data: cache.payload
					});
				}
			} else {
				models.Cache.create({
					key: req.params.key
				}, function(err, cache) {
					console.log('Cache miss');
					cb(err, {
						message: 'Cache miss',
						data: cache.payload
					});
				});
			}
		}
	], function(err, result) {
		if (err) return res.status(400).send(err);
		res.send(result);
	});

};

module.exports.createOrUpdate = function(req, res) {
	if (!req.body.payload) return res.status(400).send({
		message: 'Bad request: payload missing on request body'
	});
	async.waterfall([

		function(cb) {
			models.Cache.findOne({
				key: req.params.key
			}).exec(cb);
		},
		function(cache, cb) {
			if (cache) {
				cache.payload = req.body.payload; // only payload can be updated
				cache.save(cb);
			} else {
				models.Cache.create({
					key: req.params.key,
					payload: req.body.payload
				}, cb);
			}
		}
	], function(err, result) {
		if (err) return res.status(400).send(err);
		res.send({
			message: 'ok',
			data: result.payload
		});
	});
};


module.exports.deleteOne = function(req, res) {
	models.Cache.remove({
		key: req.params.key
	}).exec(function(err, result) {
		if (err) return res.status(400).send(err);
		res.send({
			message: 'ok'
		});
	});
};


module.exports.deleteAll = function(req, res) {
	models.Cache.remove({}).exec(function(err, result) {
		if (err) return res.status(400).send(err);
		res.send({
			message: 'ok'
		});
	});
};
