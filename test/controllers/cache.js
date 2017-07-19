process.env.APP_ENV = 'test';
var app = require('../../server');
var request = require('supertest');
var should = require('should');
var _ = require('lodash');
var tk = require('timekeeper');
var async = require('bluebird').coroutine;

describe('cache', function() {

	it('Adds new key to cache', async(function* () {
    
		var res = yield  request(app)
			                .post('/cache/cat')
			                .send({
				                payload: 'w asd cat1'
			                })
			                .set('Accept', 'application/json');
                      
    res.statusCode.should.equal(200);
		res.body.message.should.equal('ok');
		res.body.data.should.equal('w asd cat1');
    
	}));

	it('Adds new key to cache no payload provided', async(function* () {
    
		var res = yield request(app)
		                .post('/cache/cat')
			              .set('Accept', 'application/json');
			              
		res.statusCode.should.equal(400);
		res.body.message.should.equal('Bad request: payload missing on request body');
				
	}));

	it('Updates key', async(function* (done) {
    
		var res = yield request(app)
			        .post('/cache/cat')
			        .send({
				        payload: 'Wow!!'
			        })
			        .set('Accept', 'application/json');
			
		res.statusCode.should.equal(200);
		res.body.message.should.equal('ok');
		res.body.data.should.equal('Wow!!');
			
	}));

	it('Reads an existing key', async(function* () {
    
		var res = yield request(app)
			              .get('/cache/cat')
			              .set('Accept', 'application/json');
			              
		res.statusCode.should.equal(200);
		res.body.message.should.equal('Cache hit');
		res.body.data.should.equal('Wow!!');
				
	}));

	it('Reads an unexisting key', async(function* () {
    
		var res = yield request(app)
			            .get('/cache/dog')
			            .set('Accept', 'application/json');
			       
		res.statusCode.should.equal(200);
		res.body.message.should.equal('Cache miss');
		should.exists(res.body.data); //random String
				
	}));

	it('Reads all keys', async(function* (done) {
    
		var res = yield request(app)
			              .get('/cache')
			              .set('Accept', 'application/json');
			                                
    res.statusCode.should.equal(200);
    res.body.length.should.equal(2);
				
	}));

	it('Deletes a key', async(function* () {
    
		var res = yield request(app)
			              .delete('/cache/cat')
			              .set('Accept', 'application/json');
			
		res.statusCode.should.equal(200);
		res.body.message.should.equal('ok');
				
	}));

	it('Deletes all keys', async(function* () {
    
    var res = yield request(app)
                    .delete('/cache')
                    .set('Accept', 'application/json');
      
    res.statusCode.should.equal(200);
    res.body.message.should.equal('ok');
    
    res = yield request(app)
                .get('/cache')
                .set('Accept', 'application/json');
    
    res.statusCode.should.equal(200);
    res.body.length.should.equal(0);
  
	}));

	it('Creates 5 keys and reaches maxNumberOfDocuments | first key created is overwrited', async(function* () {
    
		var keysValues = [{
			key: '0',
			value: 'a'
		}, {
			key: '1',
			value: 'b'
		}, {
			key: '2',
			value: 'c'
		}, {
			key: '3',
			value: 'a'
		}, {
			key: '4',
			value: 'a'
		}];
    
		keysValues.map(function(keyValue) {
			return new Promise(function(resolve, reject) {
				setTimeout(function() { //to ensure order
					request(app)
						.post('/cache/' + keyValue.key)
						.send({
							payload: keyValue.value
						})
						.set('Accept', 'application/json')
						.end(function(err, res) {
							if (err) return reject();
							resolve();
						});
				}, 10 * Number(keyValue.key));
			});
		});
		yield Promise.all(keysValues);
			
		yield new Promise(function(resolve, reject) {
					setTimeout(function() {
						request(app)
							.get('/cache')
							.set('Accept', 'application/json')
							.end(function(err, res) {
								if (err) reject();
								res.statusCode.should.equal(200);
								res.body.length.should.equal(5);
								resolve();
							});
					}, 100);
				});
			
				yield new Promise(function(resolve, reject) {
					request(app)
						.post('/cache/5')
						.send({
							payload: 'replace first key'
						})
						.set('Accept', 'application/json')
						.end(function(err, res) {
							if (err) reject();
							res.statusCode.should.equal(200);
							res.body.message.should.equal('ok');
							res.body.data.should.equal('replace first key');
							resolve();
						});
				});
			
				yield new Promise(function(resolve, reject) {
					setTimeout(function() {
						request(app)
							.get('/cache')
							.set('Accept', 'application/json')
							.end(function(err, res) {
								if (err) reject();
								res.statusCode.should.equal(200);
								res.body.length.should.equal(5);
								res.body[4].payload.should.equal('replace first key'); //first created key was key 0 so key 5 replaced key 0
								res.body[4].key.should.equal('5');
								_.some(res.body, function(cache) {
									return cache.key === '0';
								}).should.equal(false);
								resolve();
							});
					}, 100);
				});
			
	}));

	it('TTL expires', async(function* (done) {
    
		var time = Date.now() + 3600000 * 24 * 5;
		tk.travel(time); //travels 5 days in the future
    
		var res = yield request(app)
			.get('/cache/5')
			.set('Accept', 'application/json');
			
  	res.statusCode.should.equal(200);
  	res.body.message.should.equal('Cache miss');
  	should.exists(res.body.data); //random string
				
	}));


});
