var colors      = require('colors'),
    async       = require('async'),
    statement   = require('./../../../statement');

var Transmitted = {


/*    project : function(config) {
        if(!config.projects[this.project] || _.isEmpty(config.projects[this.project])) {
            console.log(colors.warn('Конфигурация проекта ' + this.project + ' отсуцтвует!'));

        } else {
            if(!config.projects[project].jira || _.isEmpty(config.projects[project].jira)) {
                log.error('В конфигурации проекта ' + project + ' отсуцтвуют настройки JIRA!');
                status = false;
            } else {
                if(!config.projects[project].jira['project-name']) {
                    log.error('В конфигурации проекта ' + project + ' JIRA отсуцтвует названия проекта!', 'project-name');
                    status = false;
                }

                if(!config.projects[project].jira['version-name']) {
                    log.error('В конфигурации проекта ' + project + ' JIRA отсуцтвует шаблон именования версий!', 'version-name');
                    status = false;
                }
            }

            if(!config.projects[project].rpm || _.isEmpty(config.projects[project].rpm)) {
                log.error('В конфигурации проекта ' + project + ' отсуцтвуют настройки RPM!');
                status = false;
            } else {
                if(!config.projects[project].rpm['project-name']) {
                    log.error('В конфигурации проекта ' + project + ' RPM отсуцтвует названия пакета!', 'project-name');
                    status = false;
                }
            }

            if(!config.projects[project]['git-repo']) {
                log.error('В конфигурации проекта ' + project + ' не указан GIT репозиторий!');
                status = false;
            }
        }
    },*/

    checkParams : function(rli, callback) {

        async.series([
            function(callback) {
                console.log(colors.info('Проверка параметров запуска.'));
                console.log(colors.help('Пример запуска: node <dir>/app.js <project> <version>'));

                if(!statement.args.length) {
                    console.log(colors.error('Параметры запуска не указаны!'));

                    async.series([
                        this.insertProject.bind(this, rli),
                        this.insertVersion.bind(this, rli)
                    ], function(error, result) {
                        callback(null);
                    });
                } else {
                    callback(null);
                }
            }.bind(this),
            function(callback) {
                if(!statement.args[0] && !statement.project) {
                    console.log(colors.warn('В параметрах запуска не указан проект!'));
                    this.insertProject(callback);
                } else {
                    if(!statement.project) {
                        statement.project = statement.args[0].toLowerCase();
                    }

                    callback(null);
                }
            }.bind(this),
            function(callback) {
                if(!statement.args[1] && !statement.version) {
                    console.log(colors.warn('В параметрах запуска не указана версия сборки!'));
                    this.insertVersion(callback);
                } else {
                    if(!statement.version) {
                        statement.version = statement.args[1];
                    }

                    callback(null);
                }
            }.bind(this)
        ], function(error, result) {
            statement.folder  = ['CI', statement.project.toUpperCase(), statement.version].join('-');
            callback && callback();
        }.bind(this));

    },

    insertProject : function(rli, callback) {
        rli.question(colors.warn('Введите аббревиатуру проекта:'), function(answer) {
            if(answer) {
                statement.project = answer.toLowerCase();
            } else {
                process.exit(0);
            }

            callback(null);
        }.bind(this));
    },

    insertVersion : function(rli, callback) {
        rli.question(colors.warn('Введите версию сборки:'), function(answer) {
            if(answer) {
                statement.version = answer;
            } else {
                process.exit(0);
            }

            callback(null);
        }.bind(this));
    }

};

module.exports = {
    checkParams : Transmitted.checkParams.bind(Transmitted)
};