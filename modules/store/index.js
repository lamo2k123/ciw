var Store = function() {
    if(!(this instanceof Store)) {
        return new Store();
    }
    this.store = {};

    this.manager.events.on('store:get', this.get.bind(this));
    this.manager.events.on('store:set', this.set.bind(this));

    return this;
};

Store.prototype.get = function(key, message) {
    if(key && typeof key === 'string' && this.store[key]) {
        this.manager.events.emit(message, this.store[key]);
    }

    return this;
};

Store.prototype.set = function(key, value) {
    if(key) {
        if(typeof key === 'string') {
            this.store[key] = value;
        } else if(typeof key === 'object') {
            var keys = Object.keys(key);

            for(var i in keys) {
                this.store[i] = keys[i];
            }
        }
    }

    return this;
};

module.exports = function(Manager) {
    Store.prototype.manager = Manager;

    return new Store()
};