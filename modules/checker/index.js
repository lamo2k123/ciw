
module.exports = function(Manager) {
    return {
        config : require('./modules/config')(Manager),
        //transmitted : require('./modules/transmitted')(Manager)
    };
};