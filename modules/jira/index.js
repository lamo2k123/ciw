var JiraApi = require('jira').JiraApi,

	// Var
	dirname			= path.dirname(__filename),
	configFile 		= path.join(dirname, 'config.json');

var Jira = function() {
	if(!(this instanceof Jira)) {
		return new Jira();
	}

	return this;
};

Jira.prototype.connect = function() {
	this.connect = new JiraApi(config.service.jira.protocol, config.service.jira.host, config.service.jira.port, config.service.jira.user, config.service.jira.password, config.service.jira.api)
};

module.exports = function(Manager) {
	Jira.prototype.manager = Manager;

	return new Jira()
};