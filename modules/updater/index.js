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

var Updater = function() {
	if(!(this instanceof Updater)) {
		return new Updater();
	}

	this.manager.events.on('updater:set', this.set.bind(this));
	this.manager.events.on('updater:checkFileConfig', this.checkFileConfig.bind(this));
	this.manager.events.on('updater:checkModuleConfig', this.checkModuleConfig.bind(this));
	this.manager.events.on('updater:checkFileVersion', this.checkFileVersion.bind(this));
	this.manager.events.on('updater:checkUpdate', this.checkUpdate.bind(this));
	this.manager.events.on('updater:downloadUpdate', this.downloadUpdate.bind(this));
	this.manager.events.on('updater:installUpdate', this.installUpdate.bind(this));

	return this;
};

Updater.prototype.set = function(options) {
	if(options) {
		this.options = options;
	}

	return this;
};

Updater.prototype.get = function(param) {
	if(param && typeof param === 'string' && this.options && this.options[param]) {
		return this.options[param];
	}

	return null;
};

Updater.prototype.checkFileConfig = function() {
	if(fs.existsSync(configFile)) {
		var file = fs.readFileSync(configFile);
		this.config = JSON.parse(file);

		this.manager.events.emit('updater:checkFileConfig:complete');
	} else {
		console.error('[UPDATER] Файл конфигураций не найден!');
		this.manager.events.emit('updater:complete');
	}
};

Updater.prototype.checkModuleConfig = function() {
	if(this.config) {
		if(!this.config.modules) {
			this.config.modules = {};
		}

		if(!this.config.modules.updater) {
			this.config.modules.updater = {};
		}

		async.series([
			function(callback) {
				if(!this.config.modules.updater['git-repo']) {
					this.get('rli').question('[UPDATER] Укажите репозиторий обновлений (Default: "https://api.github.com/repos/lamo2k123/ciw/tags"): ', function(answer) {
						this.config.modules.updater['git-repo'] = answer || 'https://api.github.com/repos/lamo2k123/ciw/tags';

						callback(null);
					}.bind(this));
				} else {
					callback(null);
				}
			}.bind(this),
			function(callback) {
				if(!this.config.modules.updater['update-folder']) {
					this.get('rli').question('[UPDATER] Укажите директорию для обновлений (Default: "update"): ', function(answer) {
						this.config.modules.updater['update-folder'] = answer || 'update';
						callback(null);
					}.bind(this));
				} else {
					callback(null);
				}
			}.bind(this),
			function(callback) {
				if(!this.config.modules.updater['update-file-name']) {
					this.get('rli').question('[UPDATER] Укажите шаблон директории обновлений (Default: "update-{sha}"): ', function(answer) {
						this.config.modules.updater['update-file-name'] = answer || 'update-{sha}';
						callback(null);
					}.bind(this));
				} else {
					callback(null);
				}
			}.bind(this)
		], function(error) {
			if(error !== null) {
				// @TODO: Вывод ошибки и запись в лог.
			}

			fs.writeFileSync(configFile, JSON.stringify(this.config, null, 4));

			this.manager.events.emit('updater:checkModuleConfig:complete');
		}.bind(this));

	}

	return this;
};

Updater.prototype.checkFileVersion = function() {
	if(fs.existsSync(versionFile)) {
		var versionInfo = fs.readFileSync(versionFile);
		versionInfo = versionInfo.toString().split(':');
		this.currentVersion = versionInfo[0];
		this.currentHash = versionInfo[1];
	} else {
		this.currentVersion = 'v0.0.0'
		this.currentHash = '000000000000000000000';
		fs.writeFileSync(versionFile, [this.currentVersion, this.currentHash].join(':'));
		console.info('[UPDATER] Создан файл контроля версий!');
	}

	this.manager.events.emit('updater:checkFileVersion:complete');
};

Updater.prototype.checkUpdate = function() {
	console.info('[UPDATER] Проверка на наличие обновлений...');

	if(!this.config.modules.updater['git-repo']) {
		console.warn('[UPDATER] Не указан репозиторий обновлений, проверка обновлений невозможна!');
		this.manager.events.emit('updater:checkModuleConfig');
	}

	var request = https.request({
		host : url.parse(this.config.modules.updater['git-repo']).host,
		path : url.parse(this.config.modules.updater['git-repo']).path,
		headers: {
			'user-agent': 'ciw'
		}
	}, function(res) {
		if(res.statusCode !== 200 || !this.currentVersion) {
			// @TODO: Записать код ответа в лог.
			console.warn('[UPDATER] Не Удалось получить информацию по обновлениям!');
			this.manager.events.emit('updater:complete');
		} else {

			// @TODO: Класть чанку в буффер.
			var data = '';

			res.setEncoding('utf8');
			res.on('data', function(chunk) {
				data += chunk;
			});

			res.on('end', function() {
				data = JSON.parse(data);

				if(this.currentVersion !== data[0].name || this.currentHash !== data[0].commit.sha) {
					console.info('[UPDATER] Доступна новая версия!');
					console.info('[UPDATER] Версия: ' + data[0].name);
					console.info('[UPDATER] Скачать [ZIP]: ' + data[0]['zipball_url']);
					console.info('[UPDATER] Скачать [TAR]: ' + data[0]['tarball_url']);

					this.version = data[0].name;
					this.hash = data[0].commit.sha;
					this.archive = {
						zip : data[0]['zipball_url'],
						tar : data[0]['tarball_url']
					};

					this.get('rli').question('Хотите обновить CIW? [y/N]: ', function(answer) {
						if(answer.match(/^y(es)?$/i)) {
							this.manager.events.emit('updater:downloadUpdate');
						} else {
							this.manager.events.emit('updater:complete');
						}
					}.bind(this));
				} else {
					this.manager.events.emit('updater:complete');
				}

			}.bind(this));
		}

	}.bind(this));

	request.on('error', function(error) {
		// @TODO: Записать ошибку в лог.
		console.warn('[UPDATER] Не Удалось получить информацию по обновлениям!');

		this.manager.events.emit('updater:complete');
	}.bind(this));

	request.end();
};

Updater.prototype.downloadUpdate = function() {
	console.info('[UPDATER] Подождите идет загрузка обновлений...');

	this.updateFile = path.join(this.config.modules.updater['update-folder'], this.config.modules.updater['update-file-name'].replace('{sha}', this.hash.substring(0, 7)));

	request({
		url : this.archive.zip,
		headers: {
			'user-agent': 'ciw'
		}
	}, function(error) {
		if(error) {
			// @TODO: Записать ошибку в лог.
			console.error('[UPDATER] Произошла ошибка при загрузке обновлений!');
			this.manager.events.emit('updater:complete');
		}
		console.info('[UPDATER] Загрузка обновлений закончена!');

		this.manager.events.emit('updater:downloadUpdate:complete');

	}.bind(this)).pipe(fs.createWriteStream(this.updateFile));

};

Updater.prototype.installUpdate = function() {
	console.info('[UPDATER] Установка обновлений...');

	fs.createReadStream(this.updateFile).pipe(unzip.Extract({path : this.config.modules.updater['update-folder']}));

	fs.copy(path.join(this.config.modules.updater['update-folder'], ['lamo2k123-ciw', this.hash.substring(0, 7)].join('-')), path.join(__dirname, '..', '..'), function(error) {
		if(error) {
			// @TODO: Записать ошибку в лог.
			console.error('[UPDATER] Произошла ошибка при установке обновлений!');
			this.manager.events.emit('updater:complete');
		} else {
			fs.writeFileSync(versionFile, [this.version, this.hash].join(':'));
			console.info('[UPDATER] Файл контроля версий обновлён!');
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