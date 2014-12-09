var fs = require('fs');

var ManagerConfig = function() {
	if(!(this instanceof ManagerConfig)) {
		return new ManagerConfig();
	}

	this.config = {};
};

ManagerConfig.prototype.get = function(key) {
	if(!fs.existsSync('./config.json')) {
		fs.writeFileSync('./config.json', JSON.stringify(this.config));
	}

	this.config = JSON.parse(fs.readFileSync('./config.json'));

	if(key) {
		var keys = key.split('.');

		if(keys.length) {
			var section = this.config;

			for(var i in keys) {
				if(section[keys[i]]) {
					section = section[keys[i]];
				} else {
					section = null;
					break;
				}
			}

			return section;
		}

	}

	return null;
};

ManagerConfig.prototype.set = function(key, value) {
	if(key && value) {
		this.get();

		var keys = key.split('.'),
			revs = keys.reverse(),
			param= {};

		for(var i = 0; i < revs.length; i++) {
			var obj = {};

			obj[revs[i]] = (i == 0) ? value : JSON.parse(JSON.stringify(param));
			param = obj;
		}

		this.merge(this.config, param);

		fs.writeFileSync('./config.json', JSON.stringify(this.config, null, 4));
	}
};

ManagerConfig.prototype.merge = function(target, source) {
	if(typeof target !== 'object') {
		target = {};
	}

	for(var property in source) {
		if(source.hasOwnProperty(property)) {
			var sourceProperty = source[property];

			if(typeof sourceProperty === 'object') {
				target[property] = this.merge(target[property], sourceProperty);
				continue;
			}

			target[property] = sourceProperty;
		}
	}

	for(var a = 2, l = arguments.length; a < l; a++) {
		this.merge(target, arguments[a]);
	}

	return target;
};


module.exports = new ManagerConfig();