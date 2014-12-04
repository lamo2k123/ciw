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
	Notification= require('./modules/notification')(Manager),
	Updater     = require('./modules/updater')(Manager),
    Checker     = require('./modules/checker')(Manager),

	//Jira        = require('./modules/jira')(Manager),
    Statement   = require('./modules/statement');

    // Variables
    config      = null;

// https://api.github.com/repos/lamo2k123/ci-wezzet/tags

Statement.args = process.argv.slice(2);

var rli = readline.createInterface({
    input   : process.stdin,
    output  : process.stdout
});


Manager.events.emit('updater:set:rli', rli);
Manager.events.emit('checker:config:set', {rli : rli});

Manager.events.once('updater:complete', Manager.events.emit.bind(Manager.events, 'checker:config:checkFileConfig'));
Manager.events.once('updater:checkFileConfig:complete', Manager.events.emit.bind(Manager.events, 'updater:checkFileVersion'));
Manager.events.once('updater:checkFileVersion:complete', Manager.events.emit.bind(Manager.events, 'updater:checkUpdate'));
Manager.events.once('updater:checkUpdate:complete', Manager.events.emit.bind(Manager.events, 'updater:downloadUpdate'));
Manager.events.once('updater:downloadUpdate:complete', Manager.events.emit.bind(Manager.events, 'updater:installUpdate'));

//Manager.events.once('checker:config:complete', callback);
Manager.events.once('checker:config:checkFileConfig:complete', Manager.events.emit.bind(Manager.events, 'checker:config:checkConfigParams'));

Manager.events.emit('updater:checkFileConfig');


return;

async.series([
    function(callback) {
        Manager.events.once('checker:config:complete', callback);
        Manager.events.once('checker:config:checkFileConfig:complete', Manager.events.emit.bind(Manager.events, 'checker:config:checkConfigParams'));

        Manager.events.emit('checker:config:checkFileConfig');
    },
    //Checker.config.checkFile.bind(Checker.config, rli),
    //Checker.config.checkParams.bind(Checker.config, rli),
    Checker.transmitted.checkParams.bind(Checker.transmitted, rli),
    function(callback) {
        config = Statement.getConfig();

        callback(null);
    }
], function() {

    var project = version = versionId = prevCommand = pckVersion = folder = jiraNameVersion = jiraProjectName = null,
        issuesVersion = [],
        flag    = step2 = installFlag = stopNode = false,
        jira    = new JiraApi(config.service.jira.protocol, config.service.jira.host, config.service.jira.port, config.service.jira.user, config.service.jira.password, config.service.jira.api);

    project = Statement.project;
    version = Statement.version;
    folder = Statement.folder;

    async.series([
        function(callback) {
            var status = true;

            log.info('Проверка конфигурации.');

            if(!config || _.isEmpty(config)) {
                log.error('Конфигурация отсуцтвует!');
                status = false;
            } else {
                if(!config.projects || _.isEmpty(config.projects)) {
                    log.error('Конфигурации проектов отсуцтвуют!');
                    status = false;
                } else {

                }
            }

            if(status) {
                callback(null, config);
            } else {
                log.error('Пример конфигурации проекта:');
                console.log(util.inspect({
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
            }

        },

        function(callback){
            var status = true;

            log.info('Проверка проекта ' + config.projects[project].jira['project-name'] + ' в JIRA.');

            jira.getProject(config.projects[project].jira['project-name'], function(error, projectJira) {
                if(!projectJira || _.isEmpty(projectJira)) {
                    log.error('Проект ' + config.projects[project].jira['project-name'] + ' не найден в JIRA!');
                    status = false;
                } else {
                    log.info('Проверка версии ' + version + ' в ' + projectJira.name);

                    jiraNameVersion = config.projects[project].jira['version-name'].replace('{version}', version);
					jiraProjectName = projectJira.name;

                    var versionJira = _.findWhere(projectJira.versions, {
                        name : jiraNameVersion
                    });

                    if(!versionJira || _.isEmpty(versionJira)) {
                        log.error('Версия ' + jiraNameVersion + ' в проекте ' + projectJira.name + ' не найдена!');
                        status = false;
                    } else {
                        versionId = versionJira.id
                    }
                }

                if(status) {
                    callback(null, projectJira);
                }
            });


        },

        function(callback){
            var jiraVersionName = config.projects[project].jira['version-name'].replace('{version}', version);

            log.info('Проверка на наличие не закрытых задач в ' + jiraVersionName);

            jira.getUnresolvedIssueCount(versionId, function(error, count) {

                if(count) {
                    log.warn('В версии ' + jiraVersionName + ' имеются незакрытые задачи:', count);

                    var rl = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout
                    });

                    rl.question('Хотите продолжить? [y/N]', function(answer) {
                        if(answer.match(/^y(es)?$/i)) {
                            callback(null, count);
                        } else {
                            process.exit(0);
                        }
                    });
                } else {
                    callback(null, count);
                }

            });

        },

        function(callback){
            var SSH = new SSH2Shell({
                server : {
                    host : config.service.vm.host,
                    port : config.service.vm.port,
                    userName : config.service.vm.user,
                    password : config.service.vm.password
                },
                idleTimeOut: config.timeout,
                commands:      [
                    ['cd', config.dir].join(' ')
                ],
                msg : {
                    send : function(message) {
                        //           console.log(message);
                    }
                },

                onCommandComplete: function(command, response, sshObj) {
                    switch(command) {
                        case ['cd', config.dir].join(' '):
                            if(response.indexOf('No such file or directory') !== -1) {
                                log.error('Не удалось перейти в директорию:', config.dir, response);
                            } else {
                                log.info('Произведен переход в директорию:', config.dir);

                                sshObj.commands.push(['git', 'clone', config.projects[project]['git-repo'], folder].join(' '));
                            }

                            break;

                        case ['git', 'clone', config.projects[project]['git-repo'], folder].join(' '):
                            log.info('Клонирование репозитория:', config.projects[project]['git-repo']);

                            if(response.indexOf("fatal: destination path '" + folder + "' already exists and is not an empty directory.") !== -1) {
                                log.warn('Директория для клонирования не пустая:', folder);
                            }

                            sshObj.commands.push(['cd', folder].join(' '));

                            break;

                        case ['cd', folder].join(' '):
                            if(response.indexOf('No such file or directory') !== -1) {
                                log.error('Не удалось перейти в директорию ' + folder + '!');
                            } else {
                                log.info('Произведен переход в директорию: ' + [config.dir, folder].join('/'));

                                sshObj.commands.push('git rev-parse --abbrev-ref HEAD');
                            }

                            break;

                        case 'git rev-parse --abbrev-ref HEAD':
                            if(prevCommand == ['cd', folder].join(' ')) {
                                if(response.split('\r\n')[1] === config.branch.dev) {
                                    sshObj.commands.push(['git pull origin', config.branch.dev].join(' '));
                                } else {
                                    sshObj.commands.push(['git checkout -b', config.branch.dev].join(' '));
                                }

                            }
                            else if(prevCommand == ['git checkout -b', config.branch.dev].join(' ')) {
                                if(response.split('\r\n')[1] === config.branch.dev) {
                                    sshObj.commands.push(['git pull origin', config.branch.dev].join(' '));
                                } else {
                                    log.error('Переключение на ветку ' + config.branch.dev + ' не удалось. РАЗБИРАЙСЯ САМ! ПОКЕДО!');
                                }
                            }
                            else if(prevCommand == ['git checkout -b', config.branch.release].join(' ')) {
                                if(response.split('\r\n')[1] === config.branch.release) {
                                    sshObj.commands.push(['git pull origin', config.branch.release].join(' '));
                                } else {
                                    log.error('Переключение на ветку ' + config.branch.release + ' не удалось. РАЗБИРАЙСЯ САМ! ПОКА!');
                                }
                            }

                            break;

                        case ['git checkout -b', config.branch.dev].join(' '):
                            log.info('Переключение на ветку: ' + config.branch.dev);

                            sshObj.commands.push('git rev-parse --abbrev-ref HEAD');

                            break;

                        case ['git pull origin', config.branch.dev].join(' '):
                            log.info('Ветка обновлена ' + config.branch.dev);

                            sshObj.commands.push(['git checkout -b', config.branch.release].join(' '));

                            break;

                        case ['git checkout -b', config.branch.release].join(' '):
                            log.info('Переключение на ветку ' + config.branch.release);

                            sshObj.commands.push('git rev-parse --abbrev-ref HEAD');

                            break;

                        case ['git pull origin', config.branch.release].join(' '):
                            log.info('Ветка обновлена: ' + config.branch.release);


                            // @TODO: Сравнение лога с jira
                            // sshObj.commands.push('git log --pretty=format:"%s" -100');


                            sshObj.commands.push('git tag');

                            // git log --pretty=format:"%s" -100

                            log.info('Проверка тега');
                            break;

                        case 'git tag' :
                            response = response.replace(folder, '');

                            if(response.indexOf(version) !== -1) {
                                sshObj.commands.push('git merge ' + config.branch.dev);
                                log.info('Тег ' + version + ' уже существует, значит делае слияние.');
                            } else {
                                sshObj.commands.push('git tag ' + version);
                                log.info('Создание тега ' + version);
                            }
                            break;

                        case 'git tag ' + version:
                            response = response.replace(folder, '');

                            if(response.indexOf(version) !== -1) {
                                log.info('Создан тег ' + version);
                                sshObj.commands.push('git push --tags');
                                log.info('Отправка тегов');
                            } else {
                                log.error('Произошла ошибка при создание тега ' + version);
                            }

                            break;

                        case 'git push --tags':
                            sshObj.commands.push('git merge ' + config.branch.dev);
                            log.info('Слияние ветки ' + config.branch.dev + ' с веткой ' + config.branch.release);
                            break;

                        case 'git merge ' + config.branch.dev:
                            sshObj.commands.push('git push origin ' + config.branch.release);
                            log.info('Отправка результатов слияния в репозиторий.');
                            break;

                        case 'git push origin ' + config.branch.release :
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
                        sshObj.commands.push('rm -rf ' + [config.dir, folder].join('/'));
                        log.info('Удаление временной директории.');
                        step2 = true;
                    }

                    prevCommand = command;
                },
                onCommandProcessing : function onCommandProcessing( command, response, sshObj, stream )  {
                    if (command.indexOf('./bin/deploy/build.sh -u=') !== -1 && response.indexOf("password") != -1 && !flag) {
                        log.info('Подтверждение паролем отправки на repo.wezzet.com');
                        stream.write(config.service.repo.password + '\n');
                        flag = true;
                    }
                },
                onCommandTimeout:    function(command, response, sshObj, stream, connection) {
                    log.error('Таймаут:', command);
                },
                onEnd: function(sessionText, sshObj) {
                    fs.writeFile([__dirname, folder + '.log'].join('/'), sessionText, function(error) {
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
                    log.mark('Установка соединения с ' + config.service.vm.host + ':' + config.service.vm.user);
                })
                .on('ready', function() {
                    log.mark('Соединение с ' + config.service.vm.host + ':' + config.service.vm.user + ' установлено.');
                });

        },

        function(callback) {
            var SSH2 = new SSH2Shell({
                server : {
                    host : config.service.public.host,
                    port : config.service.public.port,
                    userName : config.service.public.user,
                    password : config.service.public.password
                },
                idleTimeOut: config.timeout,
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
                        sshObj.commands.push('service ' + project.toLowerCase() + ' stop');
                        log.info('Остановка NODEJS', project.toLowerCase());
                        stopNode = true;
                    }

                    if(command == 'service ' + project.toLowerCase() + ' stop') {
                        sshObj.commands.push('service ' + project.toLowerCase() + ' start');
                        log.info('Запуск NODEJS', project.toLowerCase());
                    }

                    prevCommand = command;
                },
                onCommandProcessing : function onCommandProcessing( command, response, sshObj, stream )  {
                    if (response.indexOf('password for ' + config.service.public.user) != -1) {
                        log.info('Подтверждение SUDO паролем');
                        stream.write(config.service.public.password + '\n');
                    }

                    if (response.indexOf('[y/N]') != -1 && !installFlag) {
                        log.info('Подтверждение установки пакета', pckVersion);
                        stream.write('y\n');
                        installFlag = true;
                    }
                },
                onEnd: function(sessionText, sshObj) {
					Manager.events.emit('notification:hip-chat:buildComplete', jiraNameVersion, jiraProjectName);

                    fs.writeFile([__dirname, folder + '.log'].join('/'), sessionText, function(error) {
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
                    log.mark('Установка соединения с ' + config.service.public.host + ':' + config.service.public.user);
                })
                .on('ready', function() {
                    log.mark('Соединение с ' + config.service.public.host + ':' + config.service.public.user + ' установлено.');
                });
        },

        function(callback) {
            log.info('Получение списка задач версии ' + jiraNameVersion);

            jira.searchJira('project=DYNB AND fixVersion=' + jiraNameVersion, {
                maxResults : 100,
                fields : ['summary', 'reporter', 'status', 'project', 'components', 'fixVersions', 'assignee']
            }, function(error, searchResult) {

                if(error || !searchResult) {
                    log.error('Произошла ошибка при получение списка задач.');
                } else {
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