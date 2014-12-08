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


};

module.exports = {
    checkParams : Transmitted.checkParams.bind(Transmitted)
};