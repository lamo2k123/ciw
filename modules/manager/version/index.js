var fs = require('fs');

var ManagerVersion = function() {
	if(!(this instanceof ManagerVersion)) {
		return new ManagerVersion();
	}

	this.version = {
		rev : 'v0.0.0',
		hash: '000000000000000000000'
	}
};

ManagerVersion.prototype.get = function() {
	if(!fs.existsSync('./version')) {
		this.set(this.version.rev, this.version.hash);
	}

	var info = fs.readFileSync('./version').toString().split(':');

	this.version = {
		rev : info[0],
		hash: info[1]
	};


	return this.version;
};

ManagerVersion.prototype.set = function(rev, hash) {
	if(rev && hash) {
		fs.writeFileSync('./version', rev + ':' + hash);
		console.info('[MANAGER:VERSION] Файл контроля версий обновлён!');
	}
};

module.exports = new ManagerVersion();