var JiraApi = require('jira').JiraApi;

JiraApi.prototype.searchJira = function(searchString, optional, callback) {
    // backwards compatibility
    optional = optional || {};
    if (Array.isArray(optional)) {
        optional = { fields: optional };
    }

    var url = [];

    if(searchString) {
        url.push('jql=' + searchString);
    }

    url.push(['startAt', optional.startAt || 0].join('='));
    url.push(['maxResults', optional.maxResults || 50].join('='));
    url.push(['fields', optional.fields || ["summary", "status", "assignee", "description"].join(',')].join('='));


    var options = {
        rejectUnauthorized: this.strictSSL,
        uri: this.makeUri('/search?' + encodeURIComponent(url.join('&'))),
        method: 'GET'
    };

    this.doRequest(options, function(error, response, body) {

        if (error) {
            callback(error, null);
            return;
        }

        if (response.statusCode === 400) {
            callback('Problem with the JQL query');
            return;
        }

        if (response.statusCode !== 200) {
            callback(response.statusCode + ': Unable to connect to JIRA during search.');
            return;
        }

        callback(null, body);

    });
};