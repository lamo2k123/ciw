var fs      = require('fs-extra'),
	url 	= require('url'),
	path	= require('path'),
    https   = require('https'),
    unzip   = require('unzip'),
	async	= require('async'),
	request = require('request'),

	// Var
	dirname			= path.dirname(__filename),
	rootname		= path.join(dirname, '..', '..'),
	configFile 		= path.join(rootname, 'config.json'),
	versionFile		= path.join(dirname, 'version');

var Transmitted = function() {
	if(!(this instanceof Transmitted)) {
		return new Transmitted();
	}

	this.manager.events.on('transmitted:get:args', function(params) {
		this.options.args = params;
	}.bind(this));

	this.manager.events.on('transmitted:get:project', function(params) {
		this.options.project = params;
	}.bind(this));

	this.manager.events.on('transmitted:get:version', function(params) {
		this.options.version = params;
	}.bind(this));

	this.manager.events.on('transmitted:set', this.set.bind(this));

	this.manager.events.on('transmitted:checkParams', this.checkParams.bind(this));

	return this;
};

Transmitted.prototype.set = function(options) {
	if(options) {
		this.options = options;
	}

	return this;
};

Transmitted.prototype.get = function(param) {
	if(param && typeof param === 'string' && this.options && this.options[param]) {
		return this.options[param];
	}

	return null;
};

Transmitted.prototype.checkParams = function() {

	async.series([
		function(callback) {
			console.info('[TRANSMITTED] Проверка параметров запуска.');

			this.manager.events.emit('store:get', 'args', 'transmitted:get:args');

			if(!this.get('args').length) {
				console.warn('[TRANSMITTED] Параметры запуска не указаны!');
				console.info('[TRANSMITTED] Пример запуска: node <dir>/app.js <project> <version>');

				async.series([
					this.insertProject.bind(this),
					this.insertVersion.bind(this)
				], function(error, result) {
					if(error) {
						// @TODO: Вывести ошибку и записать в лог.
					}

					callback(null);
				});
			} else {
				callback(null);
			}
		}.bind(this),
		function(callback) {
			if(!this.get('args')[0] && !this.get('project')) {
				console.log('[TRANSMITTED] В параметрах запуска не указан проект!');
				this.insertProject(callback);
			} else {
				this.manager.events.emit('store:get', 'project', 'transmitted:get:project');

				if(!this.get('project')) {
					this.manager.events.emit('store:set', 'project', this.get('args')[0].toLowerCase());
					this.manager.events.emit('store:get', 'project', 'transmitted:get:project');
				}

				callback(null);
			}
		}.bind(this),
		function(callback) {
			if(!this.get('args')[1] && !this.get('version')) {
				console.log('[TRANSMITTED] В параметрах запуска не указана версия сборки!');
				this.insertVersion(callback);
			} else {
				this.manager.events.emit('store:get', 'version', 'transmitted:get:version');

				if(!this.get('version')) {
					this.manager.events.emit('store:set', 'version', this.get('args')[1]);
					this.manager.events.emit('store:get', 'version', 'transmitted:get:version');
				}

				callback(null);
			}
		}.bind(this)
	], function(error, result) {
		if(error) {
			// @TODO: Вывести ошибку и записать в лог.
		}

		this.manager.events.emit('store:set', 'folder', ['CI', this.get('project').toUpperCase(), this.get('version')].join('-'));
		this.manager.events.emit('transmitted:complete');
	}.bind(this));

};

Transmitted.prototype.insertProject = function(callback) {
	this.get('rli').question('[TRANSMITTED] Введите аббревиатуру проекта: ', function(answer) {
		if(answer) {
			this.manager.events.emit('store:set', 'project', answer.toLowerCase());
			this.manager.events.emit('store:get', 'project', 'transmitted:get:project');
		} else {
			process.exit(0);
		}

		callback(null);
	}.bind(this));
};

Transmitted.prototype.insertVersion = function(callback) {
	this.get('rli').question('[TRANSMITTED] Введите версию сборки: ', function(answer) {
		if(answer) {
			this.manager.events.emit('store:set', 'version', answer);
			this.manager.events.emit('store:get', 'version', 'transmitted:get:version');
		} else {
			process.exit(0);
		}

		callback(null);
	}.bind(this));
};


module.exports = function(Manager) {
	Transmitted.prototype.manager = Manager;

	return new Transmitted()
};