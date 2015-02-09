var async	= require('async'),
	_		= require('underscore'),
	JiraApi = require('jira').JiraApi;

var util = require('util');

var Jira = function() {
	if(!(this instanceof Jira)) {
		return new Jira();
	}

	return this;
};

Jira.prototype.run = function(callback) {
	async.series([
		this._checkModuleConfig.bind(this),
		this._connect.bind(this),
		this.checkProject.bind(this),
		this.checkBuildStatusIssue.bind(this)
	], callback);
};

Jira.prototype.checkProject = function(callback) {
	var projectName = 'projects.' + this.manager.store.get('transmittedProject') + '.jira.project-name',
		versionName = 'projects.' + this.manager.store.get('transmittedProject') + '.jira.version-name';

	this.connect.jira.project.project(this.manager.config.get(projectName), function(projectJira) {

		if(!projectJira || _.isEmpty(projectJira)) {
			console.error('[JIRA] Проект ' + this.manager.config.get(projectName) + ' не найден в JIRA!');
			process.exit(0);
		} else {
			this.manager.store.set({
				jiraProject		: projectJira,
				jiraNameVersion : this.manager.config.get(versionName).replace('{version}', this.manager.store.get('transmittedVersion')),
				jiraProjectName : projectJira.name,
				jiraProjectKey  : projectJira.key,
				jiraProjectLeadName : projectJira.lead.name,
				jiraProjectLeadDisplayName : projectJira.lead.displayName
			});

			console.info('[JIRA] Проверка версии ' + this.manager.store.get('jiraNameVersion') + ' в ' + projectJira.name);

			var versionJira = _.findWhere(projectJira.versions, {
				name : this.manager.store.get('jiraNameVersion')
			});

			if(!versionJira || _.isEmpty(versionJira)) {
				console.error('[JIRA] Версия ' + this.manager.store.get('jiraNameVersion') + ' в проекте ' + projectJira.name + ' не найдена!');
				process.exit(0);
			} else {
				this.manager.store.set('jiraVersionId', versionJira.id);
				callback && callback(null);
			}
		}
	}.bind(this));

};

Jira.prototype.checkBuildStatusIssue = function(callback) {
	console.info('[JIRA] Проверка на наличие не закрытых задач в ' + this.manager.store.get('jiraNameVersion'));

	this.connect.jira.search.search({
		"jql": "project = "  + this.manager.store.get('jiraProjectKey') +  " AND fixVersion = "  + this.manager.store.get('jiraNameVersion'),
		"startAt": 0,
		"maxResults": 50,
		"fields": [
			'summary',
			'reporter',
			'status',
			'project',
			'components',
			'fixVersions',
			'assignee'
		]
	}, function(result) {
		if(result && result.issues) {
			var notReadyForBuild = 0;

			for(var i in result.issues) {
				if(this.manager.config.get('modules.jira.statuses').indexOf(parseInt(result.issues[i].fields.status.id, 10)) < 4) {
					if(this.manager.config.get('modules.jira.users.developers').indexOf(result.issues[i].fields.assignee.name) !== -1) {
						notReadyForBuild++;
						this.manager.events.emit('notification:hip-chat:issue-status', result.issues[i]);
					}
				}
			}

			if(!notReadyForBuild) {
				callback && callback(null)
			}
		} else {
			console.log('Not result');
		}
	}.bind(this));

};

Jira.prototype._checkModuleConfig = function(callback) {
	async.series([
		function(callback) {
			if(!this.manager.config.get('modules.jira.protocol')) {
				this.manager.store.get('rli').question('[UPDATER] Укажите протокол JIRA API (Default: "http"): ', function(answer) {
					this.manager.config.set('modules.jira.protocol', answer || 'http');
					callback(null);
				}.bind(this));
			} else {
				callback(null);
			}
		}.bind(this),
		function(callback) {
			if(!this.manager.config.get('modules.jira.host')) {
				this.manager.store.get('rli').question('[UPDATER] Укажите хост JIRA API: ', function(answer) {
					if(answer) {
						this.manager.config.set('modules.jira.host', answer);
						callback(null);
					} else {
						process.exit(0);
					}
				}.bind(this));
			} else {
				callback(null);
			}
		}.bind(this),
		function(callback) {
			if(!this.manager.config.get('modules.jira.port')) {
				this.manager.store.get('rli').question('[UPDATER] Укажите порт JIRA API (Default: "80"): ', function(answer) {
					this.manager.config.set('modules.jira.port', answer || 80);
				}.bind(this));
			} else {
				callback(null);
			}
		}.bind(this),
		function(callback) {
			if(!this.manager.config.get('modules.jira.user')) {
				this.manager.store.get('rli').question('[UPDATER] Укажите имя пользователя JIRA: ', function(answer) {
					if(answer) {
						this.manager.config.set('modules.jira.user', answer);
						callback(null);
					} else {
						process.exit(0);
					}
				}.bind(this));
			} else {
				callback(null);
			}
		}.bind(this),
		function(callback) {
			if(!this.manager.config.get('modules.jira.password')) {
				this.manager.store.get('rli').question('[UPDATER] Укажите пароль пользователя JIRA: ', function(answer) {
					if(answer) {
						this.manager.config.set('modules.jira.password', answer);
						callback(null);
					} else {
						process.exit(0);
					}
				}.bind(this));
			} else {
				callback(null);
			}
		}.bind(this),
		function(callback) {
			if(!this.manager.config.get('modules.jira.api')) {
				this.manager.store.get('rli').question('[UPDATER] Укажите версию JIRA API (Default: "2"): ', function(answer) {
					this.manager.config.set('modules.jira.api', answer || 2);
				}.bind(this));
			} else {
				callback(null);
			}
		}.bind(this)
	], callback);

};

Jira.prototype._connect = function(callback) {

	this.connect = require('atlassian-api')('jira', {
		protocol : this.manager.config.get('modules.jira.protocol'),
		host : this.manager.config.get('modules.jira.host'),
		port : this.manager.config.get('modules.jira.port'),
		user : this.manager.config.get('modules.jira.user'),
		password : this.manager.config.get('modules.jira.password'),
		api : this.manager.config.get('modules.jira.api')
	});

	callback(null);
};

module.exports = function(Manager) {
	Jira.prototype.manager = Manager;

	return new Jira()
};