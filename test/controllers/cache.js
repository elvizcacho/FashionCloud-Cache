process.env.APP_ENV = 'test';
var app = require('../../server');
var request = require('supertest');
var should = require('should');
var _ = require('lodash');
var tk = require('timekeeper');

describe('cache', function() {

	it('Adds new key to cache', function(done) {
		request(app)
			.post('/cache/cat')
			.send({
				payload: 'w asd cat1'
			})
			.set('Accept', 'application/json')
			.end(function(err, res) {
				res.statusCode.should.equal(200);
				res.body.message.should.equal('ok');
				res.body.data.should.equal('w asd cat1');
				done();
			});
	});

	it('Adds new key to cache no payload provided', function(done) {
		request(app)
			.post('/cache/cat')
			.set('Accept', 'application/json')
			.end(function(err, res) {
				res.statusCode.should.equal(400);
				res.body.message.should.equal('Bad request: payload missing on request body');
				done();
			});
	});

	it('Updates key', function(done) {
		request(app)
			.post('/cache/cat')
			.send({
				payload: 'Wow!!'
			})
			.set('Accept', 'application/json')
			.end(function(err, res) {
				res.statusCode.should.equal(200);
				res.body.message.should.equal('ok');
				res.body.data.should.equal('Wow!!');
				done();
			});
	});

	it('Reads an existing key', function(done) {
		request(app)
			.get('/cache/cat')
			.set('Accept', 'application/json')
			.end(function(err, res) {
				res.statusCode.should.equal(200);
				res.body.message.should.equal('Cache hit');
				res.body.data.should.equal('Wow!!');
				done();
			});
	});

	it('Reads an unexisting key', function(done) {
		request(app)
			.get('/cache/dog')
			.set('Accept', 'application/json')
			.end(function(err, res) {
				res.statusCode.should.equal(200);
				res.body.message.should.equal('Cache miss');
				should.exists(res.body.data); //random String
				done();
			});
	});

	it('Reads all keys', function(done) {
		request(app)
			.get('/cache')
			.set('Accept', 'application/json')
			.end(function(err, res) {
				res.statusCode.should.equal(200);
				res.body.length.should.equal(2);
				done();
			});
	});

	it('Deletes a key', function(done) {
		request(app)
			.delete('/cache/cat')
			.set('Accept', 'application/json')
			.end(function(err, res) {
				res.statusCode.should.equal(200);
				res.body.message.should.equal('ok');
				done();
			});
	});

	it('Deletes all keys', function(done) {
		new Promise(function(resolve, reject) {
			request(app)
				.delete('/cache')
				.set('Accept', 'application/json')
				.end(function(err, res) {
					if (err) return reject();
					res.statusCode.should.equal(200);
					res.body.message.should.equal('ok');
					resolve();
				});
		}).then(function() {
			request(app)
				.get('/cache')
				.set('Accept', 'application/json')
				.end(function(err, res) {
					res.statusCode.should.equal(200);
					res.body.length.should.equal(0);
					done();
				});
		});
	});

	it('Creates 5 keys and reaches maxNumberOfDocuments | first key created is overwrited', function(done) {
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
		Promise.all(keysValues)
			.then(function() {
				return new Promise(function(resolve, reject) {
					setTimeout(function() {
						request(app)
							.get('/cache')
							.set('Accept', 'application/json')
							.end(function(err, res) {
								if (err) reject();
								console.log('1');
								console.log(res.body);
								res.statusCode.should.equal(200);
								res.body.length.should.equal(5);
								resolve();
							});
					}, 100);
				});
			}).then(function() {
				return new Promise(function(resolve, reject) {
					request(app)
						.post('/cache/5')
						.send({
							payload: 'replace first key'
						})
						.set('Accept', 'application/json')
						.end(function(err, res) {
							if (err) reject();
							console.log('2');
							console.log(res.body);
							res.statusCode.should.equal(200);
							res.body.message.should.equal('ok');
							res.body.data.should.equal('replace first key');
							resolve();
						});
				});
			}).then(function() {
				return new Promise(function(resolve, reject) {
					setTimeout(function() {
						request(app)
							.get('/cache')
							.set('Accept', 'application/json')
							.end(function(err, res) {
								if (err) reject();
								console.log('3');
								console.log(res.body);
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
			}).then(function() {
				done();
			});
	});

	it('TTL expires', function(done) {
		var time = Date.now() + 3600000 * 24 * 5;
		tk.travel(time); //travels 5 days in the future
		request(app)
			.get('/cache/5')
			.set('Accept', 'application/json')
			.end(function(err, res) {
				res.statusCode.should.equal(200);
				res.body.message.should.equal('Cache miss');
				should.exists(res.body.data); //random string
				done();
			});
	});


});
