var fs = require('fs');

module.exports = {
    project : null,
    version : null,
    folder  : null,
    args    : null,
    getConfig : function() {
        // @TODO:
        if(fs.existsSync('./config.json')) {
            return JSON.parse(fs.readFileSync('./config.json'));
        }

        return {};
    }
};