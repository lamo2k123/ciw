var async = require('async');

var Transmitted = function() {
	if(!(this instanceof Transmitted)) {
		return new Transmitted();
	}

	return this;
};

Transmitted.prototype.run = function(callback) {
	async.series([
		this._checkParams.bind(this)
	], callback);
};

Transmitted.prototype._checkParams = function(callback) {

	async.series([
		function(callback) {
			if(!this.manager.store.get('argv').length) {
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
			if(!this.manager.store.get('argv')[0] && !this.manager.store.get('transmittedProject')) {
				console.log('[TRANSMITTED] В параметрах запуска не указан проект!');
				this.insertProject(callback);
			} else {
				if(!this.manager.store.get('transmittedProject')) {
					this.manager.store.set('transmittedProject', this.manager.store.get('argv')[0].toLowerCase());
				}

				callback(null);
			}
		}.bind(this),
		function(callback) {
			if(!this.manager.store.get('argv')[1] && !this.manager.store.get('transmittedVersion')) {
				console.log('[TRANSMITTED] В параметрах запуска не указана версия сборки!');
				this.insertVersion(callback);
			} else {
				if(!this.manager.store.get('transmittedVersion')) {
					this.manager.store.set('transmittedVersion', this.manager.store.get('argv')[1]);
				}

				callback(null);
			}
		}.bind(this)
	], function(error, result) {
		if(error) {
			// @TODO: Вывести ошибку и записать в лог.
			throw error;
		}

		this.manager.store.set('transmittedFolder', 'CI-' + this.manager.store.get('argv')[0].toUpperCase() + '-' + this.manager.store.get('argv')[1] + '-' + new Date().getTime());

		callback(null);
	}.bind(this));

};

Transmitted.prototype.insertProject = function(callback) {
	this.manager.store.get('rli').question('[TRANSMITTED] Введите аббревиатуру проекта: ', function(answer) {
		if(answer) {
			this.manager.store.set('transmittedProject', answer.toLowerCase());
		} else {
			process.exit(0);
		}

		callback(null);
	}.bind(this));
};

Transmitted.prototype.insertVersion = function(callback) {
	this.manager.store.get('rli').question('[TRANSMITTED] Введите версию сборки: ', function(answer) {
		if(answer) {
			this.manager.store.set('transmittedVersion', answer);
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