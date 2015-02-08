var async	= require('async'),
	_		= require('underscore'),
	JiraApi = require('jira').JiraApi;

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
		this.checkUnresolvedIssue.bind(this)
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
				jiraProjectKey  : projectJira.key
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

Jira.prototype.checkUnresolvedIssue = function(callback) {
	console.info('[JIRA] Проверка на наличие не закрытых задач в ' + this.manager.store.get('jiraNameVersion'));

	this.issue(function(issue){
		console.log(issue);
	});
/*

	this.connect.jira.version.unresolvedIssueCount(this.manager.store.get('jiraVersionId'), function(result) {
		if(result.issuesUnresolvedCount) {
			console.warn('[JIRA] В версии ' + this.manager.store.get('jiraNameVersion') + ' имеются незакрытые задачи: ', result.issuesUnresolvedCount);

			this.manager.store.get('rli').question('[JIRA] Хотите продолжить? [y/N]', function(answer) {
				if(answer.match(/^y(es)?$/i)) {
					callback(null, result.issuesUnresolvedCount);
				} else {
					process.exit(0);
				}
			});
		} else {
			callback(null, result.issuesUnresolvedCount);
		}

	}.bind(this));
*/

};

Jira.prototype.issue = function(callback) {
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
	}, callback);

/*
	this.connect2.searchJira('project=' + this.manager.store.get('jiraProjectKey') + ' AND fixVersion=' + this.manager.store.get('jiraNameVersion'), {
		maxResults : 100,
		fields : [
			'summary',
			'reporter',
			'status',
			'project',
			'components',
			'fixVersions',
			'assignee'
		]
	}, function(error, issue) {
		//callback && callback(error, JSON.parse(issue));
	});
*/

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
/*
	this.connect2 = new JiraApi(
		this.manager.config.get('modules.jira.protocol'),
		this.manager.config.get('modules.jira.host'),
		this.manager.config.get('modules.jira.port'),
		this.manager.config.get('modules.jira.user'),
		this.manager.config.get('modules.jira.password'),
		this.manager.config.get('modules.jira.api')
	);
*/

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