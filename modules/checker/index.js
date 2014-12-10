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
            if(!this.manager.config.get('service.repo.password')) {
                console.warn('[CHECKER] Не указана пароль к репозиторию repo.wezzet.com!');

                this.manager.store.get('rli').question('[CHECKER] Введите пароль к repo.wezzet.com: ', function(answer) {
                    if(answer) {
                        this.manager.config.set('service.repo.password', answer);
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
            if(!this.manager.config.get('service.vm.host')) {
                console.warn('[CHECKER] Не указана хост виртуалки разработчика (vm-dev)!');

                this.manager.store.get('rli').question('[CHECKER] Введите хост vm-dev: ', function(answer) {
                    if(answer) {
                        this.manager.config.set('service.vm.host', answer);
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
            if(!this.manager.config.get('service.vm.port')) {
                console.warn('[CHECKER] Не указана порт виртуалки разработчика (vm-dev)!');

                this.manager.store.get('rli').question('[CHECKER] Введите порт vm-dev (Default: 1022): ', function(answer) {
                    this.manager.config.set('service.vm.port', answer || 1022);
                    callback(null);
                }.bind(this));
            } else {
                callback(null);
            }
        }.bind(this),
        function(callback) {
            if(!this.manager.config.get('service.vm.user')) {
                console.warn('[CHECKER] Не указан пользователь от ' + this.manager.config.get('service.vm.host') + '!');

                this.manager.store.get('rli').question('[CHECKER] Введите имя пользователя ' + this.manager.config.get('service.vm.host') + ': ', function(answer) {
                    if(answer) {
                        this.manager.config.set('service.vm.user', answer);
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
            if(!this.manager.config.get('service.vm.password')) {
                console.warn('[CHECKER] Не указана пароль пользователя ' + this.manager.config.get('service.vm.host') + '!');

                this.manager.store.get('rli').question('[CHECKER] Введите пароль пользователя ' + this.manager.config.get('service.vm.host') + ': ', function(answer) {
                    if(answer) {
                        this.manager.config.set('service.vm.password', answer);
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
                        this.manager.config.set('service.public.user', answer);
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
            if(!this.manager.config.get('service.public.password')) {
                console.warn('[CHECKER] Не указана пароль пользователя ' + this.manager.config.get('service.public.host') + '!');

                this.manager.store.get('rli').question('[CHECKER] Введите пароль пользователя ' + this.manager.config.get('service.public.host') + ': ', function(answer) {
                    if(answer) {
                        this.manager.config.set('service.public.password', answer);
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

        /*function(callback) {
            if(!config.service.jira.protocol) {
                console.log(colors.warn('Не указана протокол JIRA!'));

                rli.question(colors.warn('Введите протокол JIRA (Default: "http"):'), function(answer) {
                    if(answer) {
                        config.service.jira.protocol = answer;
                    } else {
                        config.service.jira.protocol = 'http';
                    }

                    this.change = true;
                    callback(null);
                });
            } else {
                callback(null);
            }
        }.bind(this),
        function(callback) {
            if(!config.service.jira.host) {
                console.log(colors.warn('Не указана хост JIRA!'));

                rli.question(colors.warn('Введите хост JIRA (Default: "my.wezzet.com"):'), function(answer) {
                    if(answer) {
                        config.service.jira.host = answer;
                    } else {
                        config.service.jira.host = 'http';
                    }

                    this.change = true;
                    callback(null);
                });
            } else {
                callback(null);
            }
        }.bind(this),
        function(callback) {
            if(!config.service.jira.port) {
                console.log(colors.warn('Не указана порт JIRA!'));

                rli.question(colors.warn('Введите порт JIRA (Default: 80):'), function(answer) {
                    if(answer) {
                        config.service.jira.port = answer;
                    } else {
                        config.service.jira.port = 80;
                    }

                    this.change = true;
                    callback(null);
                });
            } else {
                callback(null);
            }
        }.bind(this),
        function(callback) {
            if(!config.service.jira.user) {
                console.log(colors.warn('Не указана пользователь JIRA!'));

                rli.question(colors.warn('Введите имя пользователя JIRA:'), function(answer) {
                    if(answer) {
                        config.service.jira.user = answer;
                    } else {
                        process.exit(0);
                    }

                    this.change = true;
                    callback(null);
                });
            } else {
                callback(null);
            }
        }.bind(this),
        function(callback) {
            if(!config.service.jira.password) {
                console.log(colors.warn('Не указана пароль пользователя JIRA!'));

                rli.question(colors.warn('Введите пароль пользователя JIRA:'), function(answer) {
                    if(answer) {
                        config.service.jira.password = answer;
                    } else {
                        process.exit(0);
                    }

                    this.change = true;
                    callback(null);
                });
            } else {
                callback(null);
            }
        }.bind(this),
        function(callback) {
            if(!config.service.jira.api) {
                console.log(colors.warn('Не указана версия API JIRA!'));

                rli.question(colors.warn('Введите версию API JIRA (Default: 2):'), function(answer) {
                    if(answer) {
                        config.service.jira.api = answer;
                    } else {
                        config.service.jira.api = '2';
                    }

                    this.change = true;
                    callback(null);
                });
            } else {
                callback(null);
            }
        }.bind(this),
        function(callback) {
            if(this.change) {
                fs.writeFile('config.json', JSON.stringify(config), function(error) {
                    if(error) {
                        throw error;
                    }

                    console.log(colors.info('Файл конфигураций сохранён!'));
                }.bind(this));
            }

            callback(null);
        }.bind(this)*/
    ], function(error) {
        if(error) {
            // @TODO
        }

        callback(null);
    });

};


module.exports = function(Manager) {
    Checker.prototype.manager = Manager;

    return new Checker()
};