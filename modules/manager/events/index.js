var events = require('events');

var ManagerEvents = function() {
	if(!(this instanceof ManagerEvents)) {
		return new ManagerEvents();
	}
};

ManagerEvents.prototype = new events.EventEmitter;

module.exports = new ManagerEvents();