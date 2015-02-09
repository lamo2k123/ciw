var async = require('async');

var Checker = function() {
    if(!(this instanceof Checker)) {
        return new Checker();
    }

    return this;
};

Checker.prototype.run = function(callback) {
    async.series([
        this._checkConfigParams.bind(this)
    ], callback);
};

Checker.prototype._checkConfigParams = function(callback) {
    console.info('[CHECKER] Проверка параметров файла конфигураций!');

    async.series([
        function(callback) {
            if(!this.manager.config.get('dir')) {
                console.warn('[CHECKER] Не указана временная директория!');

                this.manager.store.get('rli').question('[CHECKER] Введите путь к временной директории (Default: "/tmp"): ', function(answer) {
                    this.manager.config.set('dir', answer || '/tmp');

                    callback(null);
                }.bind(this));
            } else {
                callback(null);
            }
        }.bind(this),
        function(callback) {
            if(!this.manager.config.get('branch.dev')) {
                console.warn('[CHECKER] Не указана GIT ветка разработки!');

                this.manager.store.get('rli').question('[CHECKER] Введите название ветки разработки (Default: develop): ', function(answer) {
                    this.manager.config.set('branch.dev', answer || 'develop');

                    callback(null);
                }.bind(this));
            } else {
                callback(null);
            }
        }.bind(this),
        function(callback) {
            if(!this.manager.config.get('branch.release')) {
                console.warn('[CHECKER] Не указана GIT ветка релизов!');

                this.manager.store.get('rli').question('[CHECKER] Введите название ветки релизов (Default: release): ', function(answer) {
                    this.manager.config.set('branch.release', answer || 'release');

                    callback(null);
                }.bind(this));
            } else {
                callback(null);
            }
        }.bind(this),
        function(callback) {
            if(!this.manager.config.get('service.public.host')) {
                console.warn('[CHECKER] Не указана хост ***** (Public)!');

                this.manager.store.get('rli').question('[CHECKER] Введите хост Public: ', function(answer) {
                    if(answer) {
                        this.manager.config.set('service.public.host', answer);
                    } else {
                        process.exit(0);
                    }

                    callback(null);
                }.bind(this));
            } else {
                callback(null);
            }
        }.bind(this),
        function(callback) {
            if(!this.manager.config.get('service.public.port')) {
                console.warn('[CHECKER] Не указана порт ***** (Public)!');

                this.manager.store.get('rli').question('[CHECKER] Введите порт Public (Default: 1022): ', function(answer) {
                    this.manager.config.set('service.public.port', answer || 1022);
                    callback(null);
                }.bind(this));
            } else {
                callback(null);
            }
        }.bind(this),
        function(callback) {
            if(!this.manager.config.get('service.public.user')) {
                console.warn('[CHECKER] Не указана пользователь от ' + this.manager.config.get('service.public.host') + '!');

                this.manager.store.get('rli').question('[CHECKER] Введите имя пользователя ' + this.manager.config.get('service.public.host') + ': ', function(answer) {
                    if(answer) {
                        this.manager.config.set('service.public.userName', answer);
                    } else {
                        process.exit(0);
                    }

                    callback(null);
                }.bind(this));
            } else {
                callback(null);
            }
        }.bind(this),
        function(callback) {
            var confName = 'projects.' + this.manager.store.get('transmittedProject') + '.git-repo';

            if(!this.manager.config.get(confName)) {
                console.warn('[CHECKER] Не указан GIT репозиторий проекта ' + this.manager.store.get('transmittedProject') + '!');
                console.info(util.inspect({
                    "dynbls" : {
                        "git-repo" : "ssh://git@81.161.98.19:7999/dynbls/node.git",
                        "jira" : {
                            "project-name" : "DYNB",
                            "version-name" : "LSNODE-{version}"
                        },
                        "rpm" : {
                            "project-name" : "DynbLs"
                        }
                    }
                }, false, null));
                this.manager.store.get('rli').question('[CHECKER] Введите адрес GIT репозитория проекта ' + this.manager.store.get('transmittedProject') + ': ', function(answer) {
                    if(answer) {
                        this.manager.config.set(confName, answer);
                    } else {
                        process.exit(0);
                    }

                    callback(null);
                }.bind(this));
            } else {
                callback(null);
            }
        }.bind(this),
        function(callback) {
            var confName = 'projects.' + this.manager.store.get('transmittedProject') + '.jira.project-name';

            if(!this.manager.config.get(confName)) {
                console.warn('[CHECKER] Не указано ключ проекта ' + this.manager.store.get('transmittedProject') + ' в JIRA!');
                console.info(util.inspect({
                    "dynbls" : {
                        "git-repo" : "ssh://git@81.161.98.19:7999/dynbls/node.git",
                        "jira" : {
                            "project-name" : "DYNB",
                            "version-name" : "LSNODE-{version}"
                        },
                        "rpm" : {
                            "project-name" : "DynbLs"
                        }
                    }
                }, false, null));
                this.manager.store.get('rli').question('[CHECKER] Введите ключ проекта в ' + this.manager.store.get('transmittedProject') + ' JIRA: ', function(answer) {
                    if(answer) {
                        this.manager.config.set(confName, answer);
                    } else {
                        process.exit(0);
                    }

                    callback(null);
                }.bind(this));
            } else {
                callback(null);
            }
        }.bind(this),
        function(callback) {
            var confName = 'projects.' + this.manager.store.get('transmittedProject') + '.jira.version-name';

            if(!this.manager.config.get(confName)) {
                console.warn('[CHECKER] Не указан шаблон версий проекта ' + this.manager.store.get('transmittedProject') + ' в JIRA!');
                console.info(util.inspect({
                    "dynbls" : {
                        "git-repo" : "ssh://git@81.161.98.19:7999/dynbls/node.git",
                        "jira" : {
                            "project-name" : "DYNB",
                            "version-name" : "LSNODE-{version}"
                        },
                        "rpm" : {
                            "project-name" : "DynbLs"
                        }
                    }
                }, false, null));
                this.manager.store.get('rli').question('[CHECKER] Введите шаблон версий проекта в ' + this.manager.store.get('transmittedProject') + ' JIRA: ', function(answer) {
                    if(answer) {
                        this.manager.config.set(confName, answer);
                    } else {
                        process.exit(0);
                    }

                    callback(null);
                }.bind(this));
            } else {
                callback(null);
            }
        }.bind(this),
        function(callback) {
            var confName = 'projects.' + this.manager.store.get('transmittedProject') + '.rpm.project-name';

            if(!this.manager.config.get(confName)) {
                console.warn('[CHECKER] Не указан название RPM пакета проекта ' + this.manager.store.get('transmittedProject') + '!');
                console.info(util.inspect({
                    "dynbls" : {
                        "git-repo" : "ssh://git@81.161.98.19:7999/dynbls/node.git",
                        "jira" : {
                            "project-name" : "DYNB",
                            "version-name" : "LSNODE-{version}"
                        },
                        "rpm" : {
                            "project-name" : "DynbLs"
                        }
                    }
                }, false, null));
                this.manager.store.get('rli').question('[CHECKER] Введите название RPM пакета проекта ' + this.manager.store.get('transmittedProject') + ': ', function(answer) {
                    if(answer) {
                        this.manager.config.set(confName, answer);
                    } else {
                        process.exit(0);
                    }

                    callback(null);
                }.bind(this));
            } else {
                callback(null);
            }
        }.bind(this)
    ], function(error) {
        if(error)
            throw error;

        callback(null);
    });

};


module.exports = function(Manager) {
    Checker.prototype.manager = Manager;

    return new Checker()
};