var models = require('../models');
var async = require('bluebird').coroutine;
var uid = require('uid-safe');


module.exports.list = async(function* (req, res) {
  
  try {
    
    var keys = yield models.Cache.find({}).exec();
    res.send(keys);
    
  } catch (e) {
    res.status(400).send(err);  
  }
  
});

module.exports.read = async(function* (req, res) {
  
  try {
    var cache = yield models.Cache.findOne({
      key: req.params.key
    }).exec();
    
    var response = {};
    
    if (cache) {
      
      if (Date.parse(cache.modified) + (cache.ttl * 1000) < Date.now()) { // Cache is not alive anymore
        
        cache.payload = uid.sync(18);
        cache.save();
        message = 'Cache miss';
        
      } else {
        
        cache.modified = new Date();
        yield cache.save();
        message = 'Cache hit';
        
      }
      
    } else {
      
      cache = yield models.Cache.create({
        key: req.params.key
      });
      
      message = 'Cache miss';
      
    }
    
    res.send({
      message: message,
      data: cache.payload
    });
    
  } catch (err) {
    res.status(400).send(err.message);  
  }

});

module.exports.createOrUpdate = async(function* (req, res) {
  
	if (!req.body.payload) return res.status(400).send({
		message: 'Bad request: payload missing on request body'
	});
  
  try {
    
    var cache = yield models.Cache.findOne({
      key: req.params.key
    }).exec();
    
    if (cache) {
      cache.payload = req.body.payload; // only payload can be updated
      yield cache.save();
    } else {
      cache = yield models.Cache.create({
        key: req.params.key,
        payload: req.body.payload
      });
    }
    
    res.send({
      message: 'ok',
      data: cache.payload
    });
    
  } catch (err) {
    res.status(400).send(err.message);
  }
  
});


module.exports.deleteOne = async(function* (req, res) {
  
  try {
    
    yield models.Cache.remove({
      key: req.params.key
    }).exec();
    
    res.send({
      message: 'ok'
    });
    
  } catch (err) {
    res.status(400).send(err.message);
  }
  
});


module.exports.deleteAll = async(function* (req, res) {
  
  try {
    
    yield models.Cache.remove({}).exec();
    res.send({
  		message: 'ok'
  	});
    
  } catch (err) {
    res.status(400).send(err.message);
  }

});
