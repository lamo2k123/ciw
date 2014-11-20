var fs      = require('fs-extra'),
	url 	= require('url'),
	path	= require('path'),
    https   = require('https'),
    unzip   = require('unzip'),
	request = require('request'),
    colors  = require('colors'),

	// Var
	dirname			= path.dirname(__filename),
	configFile 		= path.join(dirname, 'config.json'),
	versionFile		= path.join(dirname, 'version');

var Updater = function() {
	if(!(this instanceof Updater)) {
		return new Updater();
	}

	this.manager.events.on('updater:set:rli', function(rli){
		this.rli = rli;
	}.bind(this));

	this.manager.events.on('updater:checkFileConfig', this.checkFileConfig.bind(this));
	this.manager.events.on('updater:checkFileVersion', this.checkFileVersion.bind(this));
	this.manager.events.on('updater:checkUpdate', this.checkUpdate.bind(this));
	this.manager.events.on('updater:downloadUpdate', this.downloadUpdate.bind(this));
	this.manager.events.on('updater:installUpdate', this.installUpdate.bind(this));

	return this;
};

Updater.prototype.checkFileConfig = function() {
	if(fs.existsSync(configFile)) {
		var file = fs.readFileSync(configFile);
		this.config = JSON.parse(file);

		this.manager.events.emit('updater:checkFileConfig:complete');
	} else {
		console.log(colors.error('[UPDATER] Файл конфигураций не найден!'));
		this.manager.events.emit('updater:complete');
	}
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
		console.log(colors.info('[UPDATER] Создан файл контроля версий!'));
	}

	this.manager.events.emit('updater:checkFileVersion:complete');
};

Updater.prototype.checkUpdate = function() {
	console.log(colors.info('[UPDATER] Проверка на наличие обновлений...'));

	if(!this.config['git-repo']) {
		// @TODO: Добавить предложение ввести адрес репозитория.
		// Если от предложения ввести репозиторий отказались предложить еще через неделю.
		console.log(colors.warn('[UPDATER] Не указан репозиторий обновлений, проверка обновлений невозможна!'));

		this.manager.events.emit('updater:complete');
	}

	var request = https.request({
		host : url.parse(this.config['git-repo']).host,
		path : url.parse(this.config['git-repo']).path,
		headers: {
			'user-agent': 'ciw'
		}
	}, function(res) {
		if(res.statusCode !== 200 || !this.currentVersion) {
			// @TODO: Записать код ответа в лог.
			console.log(colors.warn('[UPDATER] Не Удалось получить информацию по обновлениям!'));
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
					console.log(colors.help('[UPDATER] Доступна новая версия!'));
					console.log(colors.help('[UPDATER] Версия: ' + data[0].name));
					console.log(colors.help('[UPDATER] Скачать [ZIP]: ' + data[0]['zipball_url']));
					console.log(colors.help('[UPDATER] Скачать [TAR]: ' + data[0]['tarball_url']));

					this.version = data[0].name;
					this.hash = data[0].commit.sha;
					this.archive = {
						zip : data[0]['zipball_url'],
						tar : data[0]['tarball_url']
					};

					this.rli.question('Хотите обновить CIW? [y/N]: ', function(answer) {
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
		console.log(colors.warn('[UPDATER] Не Удалось получить информацию по обновлениям!'));

		this.manager.events.emit('updater:complete');
	}.bind(this));

	request.end();
};

Updater.prototype.downloadUpdate = function() {
	console.log(colors.info('[UPDATER] Подождите идет загрузка обновлений...'));

	this.updateFile = path.join(this.config['update-folder'], this.config['update-file-name'].replace('{sha}', this.hash.substring(0, 7)));

	request({
		url : this.archive.zip,
		headers: {
			'user-agent': 'ciw'
		}
	}, function(error) {
		if(error) {
			// @TODO: Записать ошибку в лог.
			console.log(colors.error('[UPDATER] Произошла ошибка при загрузке обновлений!'));
			this.manager.events.emit('updater:complete');
		}
		console.log(colors.info('[UPDATER] Загрузка обновлений закончена!'));

		this.manager.events.emit('updater:downloadUpdate:complete');

	}.bind(this)).pipe(fs.createWriteStream(this.updateFile));

};

Updater.prototype.installUpdate = function() {
	console.log(colors.info('[UPDATER] Установка обновлений...'));

	fs.createReadStream(this.updateFile).pipe(unzip.Extract({path : this.config['update-folder']}));
	console.log([this.version, this.hash].join(':'));

	fs.copy(path.join(this.config['update-folder'], ['lamo2k123-ciw', this.hash.substring(0, 7)].join('-')), path.join(__dirname, '..', '..'), function(error) {
		if(error) {
			// @TODO: Записать ошибку в лог.
			console.log(colors.error('[UPDATER] Произошла ошибка при установке обновлений!'));
			this.manager.events.emit('updater:complete');
		} else {
			fs.writeFileSync(versionFile, [this.version, this.hash].join(':'));
			console.log(colors.info('[UPDATER] Файл контроля версий обновлён!'));
			console.log(colors.info('[UPDATER] Установка обновлений закончена!'));
			console.log(colors.help('[UPDATER] Запустите приложение!'));
			process.exit(0);
		}
	}.bind(this));
};


module.exports = function(Manager) {
	Updater.prototype.manager = Manager;

	return new Updater()
};