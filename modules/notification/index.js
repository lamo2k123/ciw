var fs				= require('fs'),
	path			= require('path'),
	colors			= require('colors'),
	HipChatClient 	= require('hipchat-client'),

	// Var
	dirname			= path.dirname(__filename),
	configFile 		= path.join(dirname, 'config.json');

var Notification = function() {
	if(!(this instanceof Notification)) {
		return new Notification();
	}

	if(fs.existsSync(configFile)) {
		var file = fs.readFileSync(configFile);
		this.config = JSON.parse(file);
	} else {
		console.log('Нету конфига у notification');
	}

	this.initHipChat();

	return this;
};

Notification.prototype.initHipChat = function() {

	if(this.config && this.config.token && this.config.room) {
		this.hipChat = new HipChatClient(this.config.token);

		this.manager.events.on('notification:hip-chat:buildComplete', this.buildCompleteHipChat.bind(this));
	}

	return this;
};

Notification.prototype.buildCompleteHipChat = function(version, project, versionLink, projectLink) {
	var message = this.config.messages && this.config.messages.buildComplete || '{version} {project}<br>{version-link}';

	if(version) {
		message = message.replace(/{version}/g, version);
	}

	if(project) {
		message = message.replace(/{project}/g, project);
	}

	if(versionLink) {
		message = message.replace(/{version-link}/g, versionLink);
	}

	if(projectLink) {
		message = message.replace(/{project-link}/g, projectLink);
	}

	this.hipChat.api.rooms.message({
		room_id			: this.config.room,
		from			: this.config.from || '[CIW]',
		message			: message,
		color			: this.config.color || 'green',
		message_format 	: this.config.format || 'html'
	}, function(error, response) {
		if(error) {
			console.log(colors.error('При отправке оповещения в Hip-Chat произошла ошибка!'));
			// @TODO: Добавить запись ошибки в лог.
//			throw error;
		}

		if(response.status === 'sent') {
			console.log(colors.help('Отправлено оповещение в Hip-Chat!'));
		} else {
			console.log(colors.warn('Не удалось отправить оповещение в Hip-Chat!'));
		}
	});

};

module.exports = function(Manager) {
	Notification.prototype.manager = Manager;

	return new Notification()
};