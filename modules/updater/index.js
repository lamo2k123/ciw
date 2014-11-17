var fs      = require('fs'),
    https   = require('https'),
    colors  = require('colors'),

    configUpdater = fs.existsSync('./modules/updater/config.json') ? require('./config.json') : {};


var Updater = {
    checkUpdate : function(rli, callback) {

        if(!configUpdater['git-repo']) {
            return this;
        }

        var req = https.get({
                hostname: 'api.github.com',
                path: '/repos/lamo2k123/ci-wezzet/tags',
                headers: {
                    'user-agent': 'ci-wezzet'
                }
            }, this.checkVersion.bind(this, rli, callback))
            .on('error', function(e) {
                console.log(colors.warn('Не Удалось получить информацию по обновлениям!'));
            });

        req.end();
    },

    checkVersion : function(rli, callback, res) {
        if(res.statusCode !== 200 || !configUpdater['version']) {
            console.log(colors.warn('Не Удалось получить информацию по обновлениям!'));
            callback(null);
        }

        var data = '';

        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            data += chunk;
        });

        res.on('end', function() {
            data = JSON.parse(data);

            if(configUpdater.version !== data[0].name) {
                console.log(colors.help('Доступна новая версия!'));
                console.log(colors.help('Версия: ' + data[0].name));
                console.log(colors.help('Скачать [ZIP]: ' + data[0]['zipball_url']));
                console.log(colors.help('Скачать [TAR]: ' + data[0]['tarball_url']));

                rli.question(colors.warn('Хотите продолжить? [y/N]'), function(answer) {
                    if(answer.match(/^y(es)?$/i)) {
                        callback(null);
                    } else {
                        process.exit(0);
                    }
                }.bind(this));
            } else {
                callback(null);
            }

        });

    }

};

module.exports = {
    checkUpdate : Updater.checkUpdate.bind(Updater)
};