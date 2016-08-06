var controllers = require('./controllers');

module.exports.init = function(app) {

	app.get('/cache', controllers.Cache.list);
	app.get('/cache/:key', controllers.Cache.read);
	app.post('/cache/:key', controllers.Cache.createOrUpdate);
	app.delete('/cache/:key', controllers.Cache.deleteOne);
	app.delete('/cache', controllers.Cache.deleteAll);

};
