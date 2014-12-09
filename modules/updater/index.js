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
	versionFile		= path.join(dirname, 'version');

var Updater = function() {
	if(!(this instanceof Updater)) {
		return new Updater();
	}

/*	this.manager.events.on('updater:set', this.set.bind(this));
	this.manager.events.on('updater:checkFileConfig', this.checkFileConfig.bind(this));
	this.manager.events.on('updater:checkModuleConfig', this.checkModuleConfig.bind(this));
	this.manager.events.on('updater:checkFileVersion', this.checkFileVersion.bind(this));
	this.manager.events.on('updater:checkUpdate', this.checkUpdate.bind(this));
	this.manager.events.on('updater:downloadUpdate', this.downloadUpdate.bind(this));
	this.manager.events.on('updater:installUpdate', this.installUpdate.bind(this));*/

	return this;
};

Updater.prototype.run = function(callback) {
	async.series([
		this._checkModuleConfig.bind(this),
		this._checkUpdate.bind(this)
	], callback);
};


Updater.prototype._checkModuleConfig = function(callback) {
	!this.manager.config.get('modules') && this.manager.config.set('modules', {});
	!this.manager.config.get('modules.updater') && this.manager.config.set('modules.updater', {});

	async.series([
		function(callback) {
			if(!this.manager.config.get('modules.updater.git-repo')) {
				this.manager.store.get('rli').question('[UPDATER] Укажите репозиторий обновлений (Default: "https://api.github.com/repos/lamo2k123/ciw/tags"): ', function(answer) {
					this.manager.config.set('modules.updater.git-repo', answer || 'https://api.github.com/repos/lamo2k123/ciw/tags');
					callback(null);
				}.bind(this));
			} else {
				callback(null);
			}
		}.bind(this),
		function(callback) {
			if(!this.manager.config.get('modules.updater.update-folder')) {
				this.manager.store.get('rli').question('[UPDATER] Укажите директорию для обновлений (Default: "update"): ', function(answer) {
					this.manager.config.set('modules.updater.update-folder', answer || 'update');
					callback(null);
				}.bind(this));
			} else {
				callback(null);
			}
		}.bind(this),
		function(callback) {
			if(!this.manager.config.get('modules.updater.update-file-name')) {
				this.manager.store.get('rli').question('[UPDATER] Укажите шаблон директории обновлений (Default: "update-{sha}"): ', function(answer) {
					this.manager.config.set('modules.updater.update-file-name', answer || 'update-{sha}');
					callback(null);
				}.bind(this));
			} else {
				callback(null);
			}
		}.bind(this)
	], callback);

	return this;
};

Updater.prototype._checkUpdate = function(callback) {
	console.info('[UPDATER] Проверка на наличие обновлений...');

	var request = https.request({
		host : url.parse(this.manager.config.get('modules.updater.git-repo')).host,
		path : url.parse(this.manager.config.get('modules.updater.git-repo')).path,
		headers: {
			'user-agent': 'ciw'
		}
	}, function(res) {
		if(res.statusCode !== 200) {
			// @TODO: Записать код ответа в лог.
			console.warn('[UPDATER] Не Удалось получить информацию по обновлениям!');
			callback(null);
		} else {

			// @TODO: Класть чанку в буффер.
			var data = '';

			res.setEncoding('utf8');
			res.on('data', function(chunk) {
				data += chunk;
			});

			res.on('end', function() {
				data = JSON.parse(data);

				if(this.manager.version.get().rev !== data[0].name || this.manager.version.get().hash !== data[0].commit.sha) {
					this.manager.store.set({
						updaterRev 	: data[0].name,
						updaterHash	: data[0].commit.sha,
						updaterZip	: data[0]['zipball_url'],
						updaterTar	: data[0]['tarball_url']
					});

					console.info('[UPDATER] Доступна новая версия!');
					console.info('[UPDATER] Версия: ' + this.manager.store.get('updaterRev'));
					console.info('[UPDATER] Скачать [ZIP]: ' + this.manager.store.get('updaterZip'));
					console.info('[UPDATER] Скачать [TAR]: ' + this.manager.store.get('updaterTar'));

					this.manager.store.get('rli').question('Хотите обновить CIW до версии ' + this.manager.store.get('updaterRev') + '? [y/N]: ', function(answer) {
						if(answer.match(/^y(es)?$/i)) {
							this._downloadUpdate(callback);
						} else {
							callback(null);
						}
					}.bind(this));
				} else {
					callback(null);
				}

			}.bind(this));
		}

	}.bind(this));

	request.on('error', function(error) {
		if(error) {
			// @TODO: Записать ошибку в лог.
			console.warn('[UPDATER] Не Удалось получить информацию по обновлениям!');
		}

		callback(null);
	}.bind(this));

	request.end();
};

Updater.prototype._downloadUpdate = function(callback) {
	console.info('[UPDATER] Подождите идет загрузка обновлений...');

	this.manager.store.set('updaterFileUpdate', path.join(this.manager.config.get('modules.updater.update-folder'), this.manager.config.get('modules.updater.update-file-name').replace('{sha}', this.manager.store.get('updaterHash').substring(0, 7))));

	request({
		url : this.manager.store.get('updaterZip'),
		headers: {
			'user-agent': 'ciw'
		}
	}, function(error) {
		if(error) {
			// @TODO: Записать ошибку в лог.
			console.error('[UPDATER] Произошла ошибка при загрузке обновлений!');
			callback(null);
		}
		console.info('[UPDATER] Загрузка обновлений закончена!');

		this._installUpdate(callback);

	}.bind(this)).pipe(fs.createWriteStream(this.manager.store.get('updaterFileUpdate')));

};

Updater.prototype._installUpdate = function(callback) {
	console.info('[UPDATER] Установка обновлений...');

	fs.createReadStream(this.manager.store.get('updaterFileUpdate')).pipe(unzip.Extract({path : this.manager.config.get('modules.updater.update-folder')}));

	fs.copy(path.join(this.manager.config.get('modules.updater.update-folder'), ['lamo2k123-ciw', this.manager.store.get('updaterHash').substring(0, 7)].join('-')), path.join(__dirname, '..', '..'), function(error) {
		if(error) {
			// @TODO: Записать ошибку в лог.
			console.error('[UPDATER] Произошла ошибка при установке обновлений!');
			callback(null);
		} else {
			this.manager.version.set(this.manager.store.get('updaterRev'), this.manager.store.get('updaterHash'));
			console.info('[UPDATER] Установка обновлений закончена!');
			console.info('[UPDATER] Запустите приложение!');
			process.exit(0);
		}
	}.bind(this));
};

module.exports = function(Manager) {
	Updater.prototype.manager = Manager;

	return new Updater()
};