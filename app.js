require('./modules/expansion');

var fs          = require('fs'),
	util        = require('util'),
	events		= require('events'),
    readline    = require('readline'),

    // Vendors
    JiraApi     = require('jira').JiraApi,
    async       = require('async'),
    _           = require('underscore'),
    log         = require('color-log'),
    SSH2Shell   = require('ssh2shell'),
    colors      = require('colors'),

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
    Jira.run.bind(Jira)
], function(error) {
    if(error)
        throw error;

    console.log(Manager.store.get('transmittedFolder'));

    process.exit(0);
});

return;

async.series([
], function() {
    var jira = new JiraApi(Manager.config.get('service.jira.protocol'), Manager.config.get('service.jira.host'), Manager.config.get('service.jira.port'), Manager.config.get('service.jira.user'), Manager.config.get('service.jira.password'), Manager.config.get('service.jira.api'));


    var prevCommand = pckVersion = null,
        issuesVersion = [],
        flag    = step2 = installFlag = stopNode = false;

    async.series([

        function(callback){
            var SSH = new SSH2Shell({
                server : Manager.config.get('service.vm'),
                idleTimeOut: Manager.config.get('timeout'),
                commands:      [
                    'cd ' + Manager.config.get('dir')
                ],
                msg : {
                    send : function(message) {
                        //           console.log(message);
                    }
                },

                onCommandComplete: function(command, response, sshObj) {
                    switch(command) {
                        case 'cd ' + Manager.config.get('dir'):
                            if(response.indexOf('No such file or directory') !== -1) {
                                log.error('Не удалось перейти в директорию:', Manager.config.get('dir'), response);
                            } else {
                                log.info('Произведен переход в директорию:', Manager.config.get('dir'));

                                sshObj.commands.push('git clone ' + Manager.config.get('project.' + Manager.store.get('transmittedProject') + '.git-repo') + ' ' + Manager.store.get('transmittedFolder'));
                            }

                            break;

                        case ['git', 'clone', Manager.config.get('projects')[Manager.store.get('transmittedProject')]['git-repo'], Manager.store.get('transmittedFolder')].join(' '):
                            log.info('Клонирование репозитория:', Manager.config.get('projects')[Manager.store.get('transmittedProject')]['git-repo']);

                            if(response.indexOf("fatal: destination path '" + Manager.store.get('transmittedFolder') + "' already exists and is not an empty directory.") !== -1) {
                                log.warn('Директория для клонирования не пустая:', Manager.store.get('transmittedFolder'));
                            }

                            sshObj.commands.push(['cd', Manager.store.get('transmittedFolder')].join(' '));

                            break;

                        case ['cd', Manager.store.get('transmittedFolder')].join(' '):
                            if(response.indexOf('No such file or directory') !== -1) {
                                log.error('Не удалось перейти в директорию ' + Manager.store.get('transmittedFolder') + '!');
                            } else {
                                log.info('Произведен переход в директорию: ' + [Manager.config.get('dir'), Manager.store.get('transmittedFolder')].join('/'));

                                sshObj.commands.push('git rev-parse --abbrev-ref HEAD');
                            }

                            break;

                        case 'git rev-parse --abbrev-ref HEAD':
                            if(prevCommand == ['cd', Manager.store.get('transmittedFolder')].join(' ')) {
                                if(response.split('\r\n')[1] === Manager.config.get('branch.dev')) {
                                    sshObj.commands.push(['git pull origin', Manager.config.get('branch.dev')].join(' '));
                                } else {
                                    sshObj.commands.push(['git checkout -b', Manager.config.get('branch.dev')].join(' '));
                                }

                            }
                            else if(prevCommand == ['git checkout -b', Manager.config.get('branch.dev')].join(' ')) {
                                if(response.split('\r\n')[1] === Manager.config.get('branch.dev')) {
                                    sshObj.commands.push(['git pull origin', Manager.config.get('branch.dev')].join(' '));
                                } else {
                                    log.error('Переключение на ветку ' + Manager.config.get('branch.dev') + ' не удалось. РАЗБИРАЙСЯ САМ! ПОКЕДО!');
                                }
                            }
                            else if(prevCommand == ['git checkout -b', Manager.config.get('branch.release')].join(' ')) {
                                if(response.split('\r\n')[1] === Manager.config.get('branch.release')) {
                                    sshObj.commands.push(['git pull origin', Manager.config.get('branch.release')].join(' '));
                                } else {
                                    log.error('Переключение на ветку ' + Manager.config.get('branch.release') + ' не удалось. РАЗБИРАЙСЯ САМ! ПОКА!');
                                }
                            }

                            break;

                        case ['git checkout -b', Manager.config.get('branch.dev')].join(' '):
                            log.info('Переключение на ветку: ' + Manager.config.get('branch.dev'));

                            sshObj.commands.push('git rev-parse --abbrev-ref HEAD');

                            break;

                        case ['git pull origin', Manager.config.get('branch.dev')].join(' '):
                            log.info('Ветка обновлена ' + Manager.config.get('branch.dev'));

                            sshObj.commands.push(['git checkout -b', Manager.config.get('branch.release')].join(' '));

                            break;

                        case ['git checkout -b', Manager.config.get('branch.release')].join(' '):
                            log.info('Переключение на ветку ' + Manager.config.get('branch.release'));

                            sshObj.commands.push('git rev-parse --abbrev-ref HEAD');

                            break;

                        case ['git pull origin', Manager.config.get('branch.release')].join(' '):
                            log.info('Ветка обновлена: ' + Manager.config.get('branch.release'));


                            // @TODO: Сравнение лога с jira
                            // sshObj.commands.push('git log --pretty=format:"%s" -100');


                            sshObj.commands.push('git tag');

                            // git log --pretty=format:"%s" -100

                            log.info('Проверка тега');
                            break;

                        case 'git tag' :
                            response = response.replace(Manager.store.get('transmittedFolder'), '');

                            if(response.indexOf(Manager.store.get('transmittedVersion')) !== -1) {
                                sshObj.commands.push('git merge ' + Manager.config.get('branch.dev'));
                                log.info('Тег ' + Manager.store.get('transmittedVersion') + ' уже существует, значит делае слияние.');
                            } else {
                                sshObj.commands.push('git tag ' + Manager.store.get('transmittedVersion'));
                                log.info('Создание тега ' + Manager.store.get('transmittedVersion'));
                            }
                            break;

                        case 'git tag ' + Manager.store.get('transmittedVersion'):
                            response = response.replace(Manager.store.get('transmittedFolder'), '');

                            if(response.indexOf(Manager.store.get('transmittedVersion')) !== -1) {
                                log.info('Создан тег ' + Manager.store.get('transmittedVersion'));
                                sshObj.commands.push('git push --tags');
                                log.info('Отправка тегов');
                            } else {
                                log.error('Произошла ошибка при создание тега ' + Manager.store.get('transmittedVersion'));
                            }

                            break;

                        case 'git push --tags':
                            sshObj.commands.push('git merge ' + Manager.config.get('branch.dev'));
                            log.info('Слияние ветки ' + Manager.config.get('branch.dev') + ' с веткой ' + Manager.config.get('branch.release'));
                            break;

                        case 'git merge ' + Manager.config.get('branch.dev'):
                            sshObj.commands.push('git push origin ' + Manager.config.get('branch.release'));
                            log.info('Отправка результатов слияния в репозиторий.');
                            break;

                        case 'git push origin ' + Manager.config.get('branch.release') :
                            sshObj.commands.push('./bin/deploy/build.sh -a');
                            log.info('Сборка RPM пакета.');

                            break;

                        case './bin/deploy/build.sh -a' :
                            var rpm = response.match(/\/var\/tmp\/builds\/[a-z0-9-.]+\/[a-z-]+\/rpm\/RPMS\/x86_64\/[a-zA-Z0-9-._]+\.rpm/g);

                            if(rpm && rpm.length) {
                                log.info('RPM:', rpm[0]);
                                //var command = './bin/deploy/build.sh -u=' + rpm[0].replace('.x86_64.rpm', '');
                                var command = './bin/deploy/build.sh -u=' + rpm[0];
                                pckVersion = rpm[0].match(/[a-zA-Z0-9.-]+\.x[0-9_]+\.rpm/g)[0].replace('.x86_64.rpm', '');
                                sshObj.commands.push(command);
                                log.info('Отправка RPM пакета в репозиторий.');
                            }

                            break;

                    }

                    if(command.indexOf('./bin/deploy/build.sh -u=') !== -1) {
                        sshObj.commands.push('rm -rf ' + [Manager.config.get('dir'), Manager.store.get('transmittedFolder')].join('/'));
                        log.info('Удаление временной директории.');
                        step2 = true;
                    }

                    prevCommand = command;
                },
                onCommandProcessing : function onCommandProcessing( command, response, sshObj, stream )  {
                    if (command.indexOf('./bin/deploy/build.sh -u=') !== -1 && response.indexOf("password") != -1 && !flag) {
                        log.info('Подтверждение паролем отправки на repo.wezzet.com');
                        stream.write(Manager.config.get('service.repo.password') + '\n');
                        flag = true;
                    }
                },
                onCommandTimeout:    function(command, response, sshObj, stream, connection) {
                    log.error('Таймаут:', command);
                },
                onEnd: function(sessionText, sshObj) {
                    fs.writeFile([__dirname, Manager.store.get('transmittedFolder') + '.log'].join('/'), sessionText, function(error) {
                        if(error) {
                            log.error(error);
                        } else {
                            log.mark('Логи сессии сохранены.');
                        }
                    });

                    if(step2) {
                        callback(null, sessionText);
                    }
                }
            });

            SSH.connect();
            SSH
                .on('connect', function() {
                    log.mark('Установка соединения с ' + Manager.config.get('service.vm.host') + ':' + Manager.config.get('service.vm.userName'));
                })
                .on('ready', function() {
                    log.mark('Соединение с ' + Manager.config.get('service.vm.host') + ':' + Manager.config.get('service.vm.userName') + ' установлено.');
                });

        },

        function(callback) {
            var SSH2 = new SSH2Shell({
                server : Manager.config.get('service.public'),
                idleTimeOut: Manager.config.get('timeout'),
                commands:      [
                    'sudo -s'
                ],
                msg : {
                    send : function(message) {
                        //           console.log(message);
                    }
                },
                onCommandComplete: function(command, response, sshObj) {
                    if((prevCommand == 'sudo -s' || 'yum clean all && yum install ' + pckVersion) && !installFlag) {
                        sshObj.commands.push('yum clean all && yum install ' + pckVersion);
                        log.info('Ожидание индексации repo.wezzet.com');
                    }

                    if(installFlag && !stopNode) {
                        sshObj.commands.push('service ' + Manager.store.get('transmittedProject').toLowerCase() + ' stop');
                        log.info('Остановка NODEJS', Manager.store.get('transmittedProject').toLowerCase());
                        stopNode = true;
                    }

                    if(command == 'service ' + Manager.store.get('transmittedProject').toLowerCase() + ' stop') {
                        sshObj.commands.push('service ' + Manager.store.get('transmittedProject').toLowerCase() + ' start');
                        log.info('Запуск NODEJS', Manager.store.get('transmittedProject').toLowerCase());
                    }

                    prevCommand = command;
                },
                onCommandProcessing : function onCommandProcessing( command, response, sshObj, stream )  {
                    if (response.indexOf('password for ' + Manager.config.get('service.public.userName')) != -1) {
                        log.info('Подтверждение SUDO паролем');
                        stream.write(Manager.config.get('service.public.password') + '\n');
                    }

                    if (response.indexOf('[y/N]') != -1 && !installFlag) {
                        log.info('Подтверждение установки пакета', pckVersion);
                        stream.write('y\n');
                        installFlag = true;
                    }
                },
                onEnd: function(sessionText, sshObj) {
					// Arguments: jiraVersionId, jiraProjectKey, jiraVersionName, jiraProjectName
					Manager.events.emit('notification:hip-chat:buildComplete', Manager.store.get('jiraVersionId'), Manager.store.get('jiraProjectKey'), Manager.store.get('jiraNameVersion'), Manager.store.get('jiraProjectName'));

                    fs.writeFile([__dirname, Manager.store.get('transmittedFolder') + '.log'].join('/'), sessionText, function(error) {
                        if(error) {
                            log.error(error);
                        } else {
                            log.mark('Логи сессии сохранены.');
                        }
                    });

                    if(installFlag) {
                        callback(null, sessionText)
                    }
                }
            });

            SSH2.connect();
            SSH2
                .on('connect', function() {
                    log.mark('Установка соединения с ' + Manager.config.get('service.public.host') + ':' + Manager.config.get('service.public.userName'));
                })
                .on('ready', function() {
                    log.mark('Соединение с ' + Manager.config.get('service.public.host') + ':' + Manager.config.get('service.public.userName') + ' установлено.');
                });
        },

        function(callback) {
            log.info('Получение списка задач версии ' + Manager.store.get('jiraNameVersion'));

            jira.searchJira('project=' + Manager.store.get('jiraProjectKey') + ' AND fixVersion=' + Manager.store.get('jiraNameVersion'), {
                maxResults : 100,
                fields : ['summary', 'reporter', 'status', 'project', 'components', 'fixVersions', 'assignee']
            }, function(error, searchResult) {

                if(error || !searchResult) {
                    log.error('Произошла ошибка при получение списка задач.');
                } else {
                    console.log(JSON.parse(searchResult).issues);
                    issuesVersion = JSON.parse(searchResult).issues;
                }

                callback(null, searchResult);

            });
        },

        function(callback) {

            // git log --pretty=format:"%s" -100

            // @TODO: need Stack
            for(var i in issuesVersion) {

            }

        }
    ], function(err, results){
        // results is now equal to ['one', 'two']
    });








});