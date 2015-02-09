var HipChatClient = require('hipchat-client');

var Notification = function() {
	if(!(this instanceof Notification)) {
		return new Notification();
	}

	if(this.manager.config.get('modules.notification')) {
		this.config = this.manager.config.get('modules.notification');
		this.initHipChat();
	} else {
		console.error('[NOTIFICATION] Конфигурации не найдены!');
	}

	return this;
};

Notification.prototype.initHipChat = function() {

	if(this.config.token && this.config.room) {
		this.hipChat = new HipChatClient(this.config.token);

		this.manager.events.on('notification:hip-chat:buildComplete', this.buildCompleteHipChat.bind(this));
		this.manager.events.on('notification:hip-chat:issue-status', this.issueStatus.bind(this));
	}

	return this;
};

Notification.prototype.buildCompleteHipChat = function(jiraVersionId, jiraProjectKey, jiraVersionName, jiraProjectName) {
	var message = [];

	if(this.config.messages) {
		if(this.config.messages.buildComplete) {
			var messageBuildComplete= this.config.messages.buildComplete || '{version-name} {project-name}',
				status				= true;

			if(jiraVersionName) {
				messageBuildComplete = messageBuildComplete.replace(/{version-name}/g, jiraVersionName);
			} else {
				status = false;
				// @TODO: Оповещение о отсутствие параметра jiraVersionName.
				// @TODO: Запись сообщения в лог.
			}

			if(jiraProjectName) {
				messageBuildComplete = messageBuildComplete.replace(/{project-name}/g, jiraProjectName);
			} else {
				status = false;
				// @TODO: Оповещение о отсутствие параметра jiraProjectName.
				// @TODO: Запись сообщения в лог.
			}

			status && message.push(messageBuildComplete);
		} else {
			// @TODO: Оповещение о отсутствие шаблонов сообщения buildComplete.
			// @TODO: Запись сообщения в лог.
		}

		// @TODO: Может пройти без jiraProjectName и jiraVersionName которые используются.
		if(this.config.messages.projectLink) {
			if(this.config.messages.links) {
				if(jiraProjectKey) {
					if(this.config.messages.links.project) {
						var messageProjectLink 	= this.config.messages.projectLink,
							linkProject 		= this.config.links.project;

						linkProject = linkProject.replace(/{project-key}/g, jiraProjectKey);
						messageProjectLink = messageProjectLink.replace(/{project-link}/g, linkProject);
						messageProjectLink = messageProjectLink.replace(/{project-name}/g, jiraProjectName);

						message.push(messageProjectLink);
					} else {
						// @TODO: Оповещение о отсутствие шаблонов ссылки project.
						// @TODO: Запись сообщения в лог.
					}

					if(this.config.messages.versionLink) {
						if(jiraVersionId) {
							if(this.config.links.version) {
								var messageVersionLink 	= this.config.messages.versionLink,
									linkVersion 		= this.config.links.version;

								linkVersion = linkVersion.replace(/{project-key}/g, jiraProjectKey);
								linkVersion = linkVersion.replace(/{version-id}/g, jiraVersionId);
								messageVersionLink = messageVersionLink.replace(/{version-link}/g, linkVersion);
								messageVersionLink = messageVersionLink.replace(/{version-name}/g, jiraVersionName);

								message.push(messageVersionLink);
							} else {
								// @TODO: Оповещение о отсутствие шаблонов ссылки version.
								// @TODO: Запись сообщения в лог.
							}
						} else {
							// @TODO: Оповещение о отсутствие параметра jiraVersionId.
							// @TODO: Запись сообщения в лог.
						}
					} else {
						// @TODO: Оповещение о отсутствие шаблонов сообщения versionLink.
						// @TODO: Запись сообщения в лог.
					}
				} else {
					// @TODO: Оповещение о отсутствие параметра jiraProjectKey.
					// @TODO: Запись сообщения в лог.
				}
			} else {
				// @TODO: Оповещение о отсутствие шаблонов ссылок.
				// @TODO: Запись сообщения в лог.
			}
		} else {
			// @TODO: Оповещение о отсутствие шаблонов сообщения projectLink.
			// @TODO: Запись сообщения в лог.
		}
	} else {
		// @TODO: Оповещение о отсутствие шаблонов сообщений.
		// @TODO: Запись сообщения в лог.
	}

	this.hipChat.api.rooms.message({
		room_id			: this.config.room,
		from			: this.config.from || '[CIW]',
		message			: message.join(this.config.separator || '<br>'),
		color			: this.config.color || 'green',
		message_format 	: this.config.format || 'html',
		notify			: this.config.notify || false
	}, function(error, response) {
		if(error) {
			console.error('[NOTIFICATION] При отправке оповещения в Hip-Chat произошла ошибка!');
			throw error;
			// @TODO: Добавить запись ошибки в лог.
		}

		if(response.status === 'sent') {
			console.info('[NOTIFICATION] Отправлено оповещение в Hip-Chat!');
		} else {
			console.warn('[NOTIFICATION] Не удалось отправить оповещение в Hip-Chat!');
		}
	});

};

Notification.prototype.issueStatus = function(issue) {
	this.hipChat.api.rooms.message({
		room_id			: this.config.room,
		from			: this.config.from || '[CIW]',
		message			: '@' + issue.fields.assignee.displayName.replace(' ', ''),
		color			: this.config.color || 'green',
		message_format 	: 'text',
		notify			: this.config.notify || false
	}, function(error, response) {
		if(error) {
			console.error('[NOTIFICATION] При отправке оповещения в Hip-Chat произошла ошибка!');
			throw error;
			// @TODO: Добавить запись ошибки в лог.
		}

		if(response.status === 'sent') {
			console.info('[NOTIFICATION] Отправлено оповещение в Hip-Chat!');
		} else {
			console.warn('[NOTIFICATION] Не удалось отправить оповещение в Hip-Chat!');
		}
	});

	var message = [];

	var linksIssue = this.config.links.issue.replace(/{issue-key}/g, issue.key);
	var messageIssueLink = this.config.messages.issueLink.replace(/{issue-link}/g, linksIssue);
	messageIssueLink = messageIssueLink.replace(/{issue-key}/g, issue.key);
	messageIssueLink = messageIssueLink.replace(/{issue-name}/g, issue.fields.summary);

	var issueStatus = this.config.messages.issueStatus.replace(/{issue-link}/g, messageIssueLink);

	var version = [];
	for(var i in issue.fields.fixVersions) {
		version.push(issue.fields.fixVersions[i].name);
	}

	issueStatus = issueStatus.replace(/{version}/g, version.join(', '));
	issueStatus = issueStatus.replace(/{issue-status}/g, issue.fields.status.name);

	message.push(issueStatus);

	this.hipChat.api.rooms.message({
		room_id			: this.config.room,
		from			: this.config.from || '[CIW]',
		message			: message.join(this.config.separator || '<br>'),
		color			: 'red',
		message_format 	: this.config.format || 'html',
		notify			: this.config.notify || false
	}, function(error, response) {
		if(error) {
			console.error('[NOTIFICATION] При отправке оповещения в Hip-Chat произошла ошибка!');
			throw error;
			// @TODO: Добавить запись ошибки в лог.
		}

		if(response.status === 'sent') {
			console.info('[NOTIFICATION] Отправлено оповещение в Hip-Chat!');
		} else {
			console.warn('[NOTIFICATION] Не удалось отправить оповещение в Hip-Chat!');
		}
	});

};

module.exports = function(Manager) {
	Notification.prototype.manager = Manager;

	return new Notification()
};