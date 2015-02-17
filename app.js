require('./modules/expansion');

var fs          = require('fs'),
    readline    = require('readline'),
    path        = require('path'),
    childProcess= require('child_process'),

    // Vendors
    async       = require('async'),
    _           = require('underscore'),
    log         = require('color-log'),
    SSH2Shell   = require('ssh2shell'),

    // Custom
	Manager		= require('./modules/manager'),
    Updater     = require('./modules/updater')(Manager),
    Transmitted = require('./modules/transmitted')(Manager),
    Checker     = require('./modules/checker')(Manager),
    Jira        = require('./modules/jira')(Manager),
	Notification= require('./modules/notification')(Manager);

// https://api.github.com/repos/lamo2k123/ci-wezzet/tags

Manager.store.set({
    argv    : process.argv.slice(2),
    rli     : readline.createInterface({
        input   : process.stdin,
        output  : process.stdout
    })
});

async.series([
    Updater.run.bind(Updater),
    Transmitted.run.bind(Transmitted),
    Checker.run.bind(Checker),
    Jira.run.bind(Jira),
    // Клонирование репозитория
    function(callback) {
        var command = Manager.config.get('commands.git.clone');

        command = command.replace('{repo}', Manager.config.get('projects.' + Manager.store.get('transmittedProject') + '.git-repo'));
        command = command.replace('{folder}', Manager.store.get('transmittedFolder'));

        childProcess.exec(command, {
            cwd : path.join(__dirname, Manager.config.get('dir'))
        }, function(error, stdout, stderr) {

            if(error !== null)
                throw error;

            if(stderr) {
                console.log(stderr + '\n' +  stdout);
            }

            callback && callback(null);
        });
    },
    // User
    function(callback) {
        var command = Manager.config.get('commands.git.author'),
            out     = null;

        childProcess.exec(command, {
            cwd : path.join(__dirname, Manager.config.get('dir'), Manager.store.get('transmittedFolder'))
        }, function(error, stdout, stderr) {
            if(error !== null)
                throw error;

            out = stderr + '\n' +  stdout;

            if(stderr) {
                console.log(out);
            }

            callback && callback(null);
        });
    },
    // Переход в ветку release
    function(callback) {
        var command = Manager.config.get('commands.git.checkout'),
            out     = null;

        command = command.replace('{branch}', Manager.config.get('branch.release'));

        childProcess.exec(command, {
            cwd : path.join(__dirname, Manager.config.get('dir'), Manager.store.get('transmittedFolder'))
        }, function(error, stdout, stderr) {
            if(error !== null)
                throw error;

            out = stderr + '\n' +  stdout;

            if(out.search("Switched to a new branch '" + Manager.config.get('branch.release') + "'") !== -1) {
                callback && callback(null);
            } else {
                console.log(out);
            }
        });
    },
    // Проверка текущей ветки
    function(callback) {
        var command = Manager.config.get('commands.git.branch'),
            out     = null;

        childProcess.exec(command, {
            cwd : path.join(__dirname, Manager.config.get('dir'), Manager.store.get('transmittedFolder'))
        }, function(error, stdout, stderr) {
            if(error !== null)
                throw error;

            out = stderr + '\n' +  stdout;

            if(out.search(Manager.config.get('branch.release')) !== -1) {
                callback && callback(null);
            } else {
                console.log(out);
            }
        });
    },
    // Проверка тегов
    function(callback) {
        var command = Manager.config.get('commands.git.tags'),
            out     = null;

        childProcess.exec(command, {
            cwd : path.join(__dirname, Manager.config.get('dir'), Manager.store.get('transmittedFolder'))
        }, function(error, stdout, stderr) {
            if(error !== null)
                throw error;

            out = stderr + '\n' +  stdout;

            if(out.search(Manager.store.get('transmittedVersion')) !== -1) {
                Manager.store.set('repoTagStatus', true);
            } else {
                Manager.store.set('repoTagStatus', false);
            }

            callback && callback(null);
        });
    },
    // Создание тега версии
    function(callback) {
        if(Manager.store.get('repoTagStatus')) {
            callback && callback(null);
        } else {
            var command = Manager.config.get('commands.git.create-tag'),
                out     = null;

            command = command.replace('{version}', Manager.store.get('transmittedVersion'));

            childProcess.exec(command, {
                cwd : path.join(__dirname, Manager.config.get('dir'), Manager.store.get('transmittedFolder'))
            }, function(error, stdout, stderr) {
                if(error !== null)
                    throw error;

                out = stderr + '\n' +  stdout;

                callback && callback(null);
            });
        }
    },
    // Отправка тегов в origin
    function(callback) {
        if(Manager.store.get('repoTagStatus')) {
            callback && callback(null);
        } else {
            var command = Manager.config.get('commands.git.push-tag'),
                out     = null;

            childProcess.exec(command, {
                cwd : path.join(__dirname, Manager.config.get('dir'), Manager.store.get('transmittedFolder'))
            }, function(error, stdout, stderr) {
                if(error !== null)
                    throw error;

                out = stderr + '\n' +  stdout;

                // @TODO: Вставить регулярку на проверку полного совпадения
                if(out.indexOf('new tag') !== -1) {
                    callback && callback(null);
                } else {
                    console.log(out);
                }
            });
        }
    },
    // Merge dev -> release
    function(callback) {
        var command = Manager.config.get('commands.git.merge'),
            out     = null;

        command = command.replace('{branch}', Manager.config.get('branch.dev'));

        childProcess.exec(command, {
            cwd : path.join(__dirname, Manager.config.get('dir'), Manager.store.get('transmittedFolder'))
        }, function(error, stdout, stderr) {
            if(error !== null)
                throw error;

            out = stderr + '\n' + stdout;

            if(out.indexOf('Merge') !== -1) {
                callback && callback(null);
            } else {
                console.log(out);
                Manager.store.get('rli').question('Продолжить? [y/N]: ', function(answer) {
			if(answer.match(/^y(es)?$/i)) {
				Manager.store.set('force', true);
				callback && callback(null);
			} else {
				process.exit(0);
			}
		}.bind(this));
            }
        });
    },
    // Push merge result to release
    function(callback) {
    	if (Manager.store.get('force')) {
    		callback && callback(null);
    	} else {
    		var command = Manager.config.get('commands.git.push'),
            	out     = null;

	        command = command.replace('{branch}', Manager.config.get('branch.release'));
	
	        childProcess.exec(command, {
	            cwd : path.join(__dirname, Manager.config.get('dir'), Manager.store.get('transmittedFolder'))
	        }, function(error, stdout, stderr) {
	            if(error !== null)
	                throw error;
	
	            out = stderr + '\n' + stdout;
	
	            // @TODO: Вставить регулярку на проверку полного совпадения
	            //    59f76f6..c8364f4  test-release -> test-release
	            if(out.indexOf(Manager.config.get('branch.release') + ' -> ' + Manager.config.get('branch.release')) !== -1) {
	                callback && callback(null);
	            } else {
	                console.log(out);
	            }
	        });
    	}
    	
        
    },
    // Сборка RPM пакета
    function(callback) {
        console.info('Сборка RPM пакета.');

        var command = Manager.config.get('commands.build.deploy');

        childProcess.exec(command, {
            cwd : path.join(__dirname, Manager.config.get('dir'), Manager.store.get('transmittedFolder'))
        }, function(error, stdout, stderr) {
            var rpm = stdout.match(/\/var\/tmp\/builds\/[a-z0-9-.]+\/[a-z-]+\/rpm\/RPMS\/x86_64\/[a-zA-Z0-9-._]+\.rpm/g);

            console.log('[HERE]', rpm, stdout);

            if(rpm && rpm.length) {
                Manager.store.set('rpmPackage', rpm[0]);
                Manager.store.set('rpmPackageVersion', rpm[0].match(/[a-zA-Z0-9.-]+\.x[0-9_]+\.rpm/g)[0].replace('.x86_64.rpm', ''));
                callback && callback(null);
            } else {
                console.error('[ERROR]', error);
                console.error('[STDERR]', stderr);
                console.log('[STDOUT]', stdout);
            }
        });
    },
    // Upload RPM
    function(callback) {
        console.info('Загрузка RPM пакета.');
        if(Manager.store.get('rpmPackage')) {
            var command = Manager.config.get('commands.build.upload');

            command = command.replace('{rpm}', Manager.store.get('rpmPackage'));

            childProcess.exec(command, {
                cwd : path.join(__dirname, Manager.config.get('dir'), Manager.store.get('transmittedFolder'))
            }, function(error, stdout, stderr) {

                if(/Upload success/.test(stdout)) {
                    Manager.store.set('rpmPackageUpload', true);
                    callback && callback(null);
                } else {
                    Manager.store.set('rpmPackageUpload', false);
                    console.error('[ERROR]', error);
                    console.error('[STDERR]', stderr);
                    console.log('[STDOUT]', stdout);

                    // @TODO: Завершение процесса
                }

            });

        } else {
            // @TODO: Завершение процесса
        }

    },
    // Clean
    function(callback) {
        console.info('Очистка!');
        if(Manager.store.get('rpmPackageUpload')) {
            var command = Manager.config.get('commands.remove');

            command = command.replace('{folder}', Manager.store.get('transmittedFolder'));

            childProcess.exec(command, {
                cwd : path.join(__dirname, Manager.config.get('dir'))
            }, function(error, stdout, stderr) {
                if(error)
                    throw error;

                callback && callback(null);
            });

        } else {
            callback && callback(null);
        }
    },
    // Установка пакета на public
    function(callback) {
        console.info('Установка пакета');
        if(Manager.store.get('rpmPackageUpload') && Manager.store.get('rpmPackageVersion')) {
            var command = Manager.config.get('commands.install');

            command = command.replace('{port}', Manager.config.get('service.public.port'));
            command = command.replace('{user}', Manager.config.get('service.public.user'));
            command = command.replace('{host}', Manager.config.get('service.public.host'));
            command = command.replace('{package}', Manager.store.get('rpmPackageVersion'));

            var install = function() {
                console.log('Ожидание пакета в репе');
                childProcess.exec(command, {
                    cwd : path.join(__dirname, Manager.config.get('dir'))
                }, function(error, stdout, stderr) {
                    console.log(error, stdout, stderr);

                    if(/Complete!/.test(stdout)) {
                        Manager.store.set('rpmPackageInstall', true);
                        callback && callback(null);
                    } else {
                        Manager.store.set('rpmPackageInstall', false);
                        install();
                    }

                });
            };

            install();

        } else {
            callback && callback(null);
        }
    },
    // Stop node
    function(callback) {
        console.info('Stop node');

        if(Manager.store.get('rpmPackageInstall')) {
            var command = Manager.config.get('commands.stop');

            command = command.replace('{port}', Manager.config.get('service.public.port'));
            command = command.replace('{user}', Manager.config.get('service.public.user'));
            command = command.replace('{host}', Manager.config.get('service.public.host'));
            command = command.replace('{project}', Manager.store.get('transmittedProject').toLowerCase());

            childProcess.exec(command, function(error, stdout, stderr) {
                if(error)
                    throw error;

                callback && callback(null);
            });

        } else {
            callback && callback(null);
        }
    },
    // Start node
    function(callback) {
        console.info('Start node');

        if(Manager.store.get('rpmPackageInstall')) {
            var command = Manager.config.get('commands.start');

            command = command.replace('{port}', Manager.config.get('service.public.port'));
            command = command.replace('{user}', Manager.config.get('service.public.user'));
            command = command.replace('{host}', Manager.config.get('service.public.host'));
            command = command.replace('{project}', Manager.store.get('transmittedProject').toLowerCase());

            childProcess.exec(command, function(error, stdout, stderr) {
                if(error)
                    throw error;

                callback && callback(null);
            });

        } else {
            callback && callback(null);
        }
    }
], function(error) {
    if(error)
        throw error;

    // Arguments: jiraVersionId, jiraProjectKey, jiraVersionName, jiraProjectName
    Manager.events.emit('notification:hip-chat:buildComplete', Manager.store.get('jiraVersionId'), Manager.store.get('jiraProjectKey'), Manager.store.get('jiraNameVersion'), Manager.store.get('jiraProjectName'));


    //console.log(Manager.store.get('transmittedFolder'));
    //
    //process.exit(0);
});
