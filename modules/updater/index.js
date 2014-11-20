var fs      = require('fs-extra'),
	url 	= require('url'),
	path	= require('path'),
    https   = require('https'),
    unzip   = require('unzip'),
	request = require('request'),
    colors  = require('colors'),

	// Var
	dirname = path.dirname(__filename);

var Updater = function() {
	// @TODO: Добавить проверку перед импортом конфига.
	this.config = require('./config.json');
	// @TODO: Забирать версию и хеш из файла version.
	if(fs.existsSync(path.join(dirname, 'version'))) {
		var versionFile = fs.readFileSync(path.join(dirname, 'version'));
		versionFile = versionFile.toString().split(':');
		this.currentVersion = versionFile[0];
		this.currentHash = versionFile[1];
	} else {
		this.currentVersion = 'v0.0.0'
		this.currentHash = '000000000000000000000';
		fs.writeFileSync(path.join(dirname, 'version'), [this.currentVersion, this.currentHash].join(':'));
		console.log(colors.info('Создан файл контроля версий!'));
	}

	return {
		checkUpdate : this.checkUpdate.bind(this)
	};
};

Updater.prototype.checkUpdate = function(rli, callback) {
	console.log(colors.info('Проверка обновлений...'));
	if(!this.config['git-repo']) {
		// @TODO: Добавить предложение ввести адрес репозитория.
		// Если от предложения ввести репозиторий отказались предложить еще через неделю.
		console.log(colors.warn('Не указан репозиторий обновлений, проверка обновлений невозможна!'));
		return this;
	}

	var request = https.request({
		host : url.parse(this.config['git-repo']).host,
		path : url.parse(this.config['git-repo']).path,
		headers: {
			'user-agent': 'ciw'
		}
	}, this.checkVersion.bind(this, rli, callback));

	request.on('error', function(error) {
		// @TODO: Записать ошибку в лог.
		console.log(colors.warn('Не Удалось получить информацию по обновлениям!'));
	});

	request.end();
};

Updater.prototype.checkVersion = function(rli, callback, res) {
	if(res.statusCode !== 200 || !this.currentVersion) {
		// @TODO: Записать код ответа в лог.
		console.log(colors.warn('Не Удалось получить информацию по обновлениям!'));
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

			// @TODO: Добавить сравнение хешей версий.
			if(this.currentVersion !== data[0].name || this.currentHash !== data[0].commit.sha) {
				console.log(colors.help('Доступна новая версия!'));
				console.log(colors.help('Версия: ' + data[0].name));
				console.log(colors.help('Скачать [ZIP]: ' + data[0]['zipball_url']));
				console.log(colors.help('Скачать [TAR]: ' + data[0]['tarball_url']));

				this.version = data[0].name;
				this.hash = data[0].commit.sha;
				this.archive = {
					zip : data[0]['zipball_url'],
					tar : data[0]['tarball_url']
				};

				rli.question('Хотите обновить CIW? [y/N]: ', function(answer) {
					if(answer.match(/^y(es)?$/i)) {
						this.download(callback);
					} else {
						callback(null);
					}
				}.bind(this));
			} else {
				callback(null);
			}

		}.bind(this));
	}

};

Updater.prototype.download = function(callback) {
	console.log(colors.info('Подождите идет загрузка обновлений...'));

	request({
		url : this.archive.zip,
		headers: {
			'user-agent': 'ciw'
		}
	}, function(error) {
		if(error) {
			// @TODO: Записать ошибку в лог.
			console.log(colors.error('Произошла ошибка при загрузке обновлений!'));
			callback(null)
		}
		console.log(colors.info('Загрузка обновлений закончена!'));
		this.install(callback);
	}.bind(this)).pipe(fs.createWriteStream(path.join(this.config['update-folder'], this.config['update-file-name'].replace('{sha}', this.hash.substring(0, 7)))));

};

Updater.prototype.install = function(callback) {
	console.log(colors.info('Установка обновлений...'));
	fs.createReadStream(path.join(this.config['update-folder'], this.config['update-file-name'].replace('{sha}', this.hash.substring(0, 7)))).pipe(unzip.Extract({ path: this.config['update-folder'] }));

	fs.copy(path.join(this.config['update-folder'], ['lamo2k123-ciw', this.hash.substring(0, 7)].join('-')), path.join(__dirname, '..', '..'), function(error) {
		if(error) {
			// @TODO: Записать ошибку в лог.
			console.log(colors.error('Произошла ошибка при установке обновлений!'));
			callback(null);
		} else {
			fs.writeFileSync(path.join(dirname, 'version'), [this.version, this.hash].join(':'));
			console.log(colors.info('Файл контроля версий обновлён!'));
			console.log(colors.info('Установка обновлений закончена!'));
			console.log(colors.help('Запустите приложение!'));
			process.exit(0);
		}
	}.bind(this));
};

module.exports = new Updater();