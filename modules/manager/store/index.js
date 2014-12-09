var ManagerStore = function() {
	if(!(this instanceof ManagerStore)) {
		return new ManagerStore();
	}

	this.storage = {};

};

ManagerStore.prototype.get = function(key) {
	return (key && this.storage[key]) ? this.storage[key] : null;
};

ManagerStore.prototype.set = function(key, value) {
	if(key) {
		if(typeof key === 'string') {
			this.storage[key] = value;
		} else if(typeof key === 'object') {
			var keys = Object.keys(key);

			for(var i in keys) {
				this.storage[keys[i]] = key[keys[i]];
			}
		}
	}
};

module.exports = new ManagerStore();