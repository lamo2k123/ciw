var fs      = require('fs'),
    _       = require('underscore'),
    async   = require('async'),
    colors  = require('colors');

var Config = {
    change : false,

    checkFile : function(rli, callback) {
        var configFile = fs.existsSync('./config.json');

        if(!configFile) {
            console.log(colors.warn('Файл конфигураций "config.json" не найден!'));

            rli.question(colors.warn('Хотите создать "config.json"? [y/N]'), function(answer) {
                if(answer.match(/^y(es)?$/i)) {
                    fs.writeFile('config.json', '{}', function(error) {
                        if(error) {
                            throw error;
                        }

                        console.log(colors.info('Файл конфигураций создан!'));
                        callback(null);
                    }.bind(this));
                } else {
                    process.exit(0);
                }
            }.bind(this));
        } else {
            callback(null);
        }

    },

    checkParams : function(rli, callback) {
        console.log(colors.info('Проверка параметров файла конфигураций!'));

        var config;

        try {
            config = JSON.parse(fs.readFileSync('./config.json'));
        } catch (e) {
            config = {};
        }

        async.series([
            function(callback){
                if(!config || _.isEmpty(config)) {
                    config = {};
                    this.change = true;
                }

                callback();
            }.bind(this),
            function(callback) {
                if(!config.dir) {
                    console.log(colors.warn('Не указана директория для временных файлов!'));

                    rli.question(colors.warn('Введите путь к временной директории (Default: "/tmp"):'), function(answer) {
                        if(answer) {
                            config.dir = answer;
                        } else {
                            config.dir = '/tmp';
                        }

                        this.change = true;
                        callback(null);
                    });
                } else {
                    callback(null);
                }
            }.bind(this),
            function(callback) {
                if(!config.timeout) {
                    console.log(colors.warn('Не указано время таймаута процесса!'));

                    rli.question(colors.warn('Введите таймаута процесса (Default: 30000):'), function(answer) {
                        if(answer) {
                            config.timeout = answer;
                        } else {
                            config.timeout = 30000;
                        }

                        this.change = true;
                        callback(null);
                    });
                } else {
                    callback(null);
                }
            }.bind(this),
            // @TODO
            function(callback) {
                if(!config.branch) {
                    config.branch = {};
                    this.change = true;
                }

                callback(null);
            }.bind(this),
            function(callback) {
                if(!config.branch.dev) {
                    console.log(colors.warn('Не указана GIT ветка разработки!'));

                    rli.question(colors.warn('Введите название ветки разработки (Default: develop):'), function(answer) {
                        if(answer) {
                            config.branch.dev = answer;
                        } else {
                            config.branch.dev = 'develop';
                        }

                        this.change = true;
                        callback(null);
                    });
                } else {
                    callback(null);
                }
            }.bind(this),
            function(callback) {
                if(!config.branch.release) {
                    console.log(colors.warn('Не указана GIT ветка релизов!'));

                    rli.question(colors.warn('Введите название ветки релизов (Default: release):'), function(answer) {
                        if(answer) {
                            config.branch.release = answer;
                        } else {
                            config.branch.release = 'release';
                        }

                        this.change = true;
                        callback(null);
                    });
                } else {
                    callback(null);
                }
            }.bind(this),
            // @TODO:
            function(callback) {
                if(!config.service) {
                    config.service = {};
                    this.change = true;
                }

                callback(null);
            }.bind(this),
            // @TODO:
            function(callback) {
                if(!config.service.repo) {
                    config.service.repo = {};
                    this.change = true;
                }

                callback(null);
            }.bind(this),
            function(callback) {
                if(!config.service.repo.password) {
                    console.log(colors.warn('Не указана пароль к репозиторию repo.wezzet.com!'));

                    rli.question(colors.warn('Введите пароль к repo.wezzet.com:'), function(answer) {
                        if(answer) {
                            config.service.repo.password = answer;
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
            // @TODO:
            function(callback) {
                if(!config.service.vm) {
                    config.service.vm = {};
                    this.change = true;
                }

                callback(null);
            }.bind(this),
            function(callback) {
                if(!config.service.vm.host) {
                    console.log(colors.warn('Не указана хост виртуалки разработчика (vm-dev)!'));

                    rli.question(colors.warn('Введите хост vm-dev:'), function(answer) {
                        if(answer) {
                            config.service.vm.host = answer;
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
                if(!config.service.vm.port) {
                    console.log(colors.warn('Не указана порт виртуалки разработчика (vm-dev)!'));

                    rli.question(colors.warn('Введите порт vm-dev (Default: 1022):'), function(answer) {
                        if(answer) {
                            config.service.vm.port = answer;
                        } else {
                            config.service.vm.port = 1022;
                        }

                        this.change = true;
                        callback(null);
                    });
                } else {
                    callback(null);
                }
            }.bind(this),
            function(callback) {
                if(!config.service.vm.user) {
                    console.log(colors.warn('Не указана пользователь от ' + config.service.vm.host + '!'));

                    rli.question(colors.warn('Введите имя пользователя ' + config.service.vm.host + ':'), function(answer) {
                        if(answer) {
                            config.service.vm.user = answer;
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
                if(!config.service.vm.password) {
                    console.log(colors.warn('Не указана пароль пользователя ' + config.service.vm.host + '!'));

                    rli.question(colors.warn('Введите пароль пользователя ' + config.service.vm.host + ':'), function(answer) {
                        if(answer) {
                            config.service.vm.password = answer;
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
            // @TODO:
            function(callback) {
                if(!config.service.public) {
                    config.service.public = {};
                    this.change = true;
                }

                callback(null);
            }.bind(this),
            function(callback) {
                if(!config.service.public.host) {
                    console.log(colors.warn('Не указана хост ***** (Public)!'));

                    rli.question(colors.warn('Введите хост Public:'), function(answer) {
                        if(answer) {
                            config.service.public.host = answer;
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
                if(!config.service.public.port) {
                    console.log(colors.warn('Не указана порт ***** (Public)!'));

                    rli.question(colors.warn('Введите порт Public (Default: 1022):'), function(answer) {
                        if(answer) {
                            config.service.public.port = answer;
                        } else {
                            config.service.public.port = 1022;
                        }

                        this.change = true;
                        callback(null);
                    });
                } else {
                    callback(null);
                }
            }.bind(this),
            function(callback) {
                if(!config.service.public.user) {
                    console.log(colors.warn('Не указана пользователь от ' + config.service.public.host + '!'));

                    rli.question(colors.warn('Введите имя пользователя ' + config.service.public.host + ':'), function(answer) {
                        if(answer) {
                            config.service.public.user = answer;
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
                if(!config.service.public.password) {
                    console.log(colors.warn('Не указана пароль пользователя ' + config.service.public.host + '!'));

                    rli.question(colors.warn('Введите пароль пользователя ' + config.service.public.host + ':'), function(answer) {
                        if(answer) {
                            config.service.public.password = answer;
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
            // @TODO:
            function(callback) {
                if(!config.service.jira) {
                    config.service.jira = {};
                    this.change = true;
                }

                callback(null);
            }.bind(this),
            function(callback) {
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
            }.bind(this)
        ], function(error, result) {
            console.log(colors.info('Проверка конфигураций завершена.!'));
            callback && callback(null);
        }.bind(this));

    }

};

module.exports = {
    checkFile : Config.checkFile,
    checkParams : Config.checkParams
};