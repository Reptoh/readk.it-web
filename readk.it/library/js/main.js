 /*global require:false, console:false */
require.config({
    //By default load any module IDs from js/lib
    baseUrl: 'js/lib',
    //except, if the module ID starts with "app",
    //load it from the js/app directory.
    paths: {
        app: '../app',
        underscore: 'underscore-min.amd'
    },
    shim: {
        'sly': ['jquery']
    }
});

var initialized = function () {
    if (console && console.log) {
        console.log('main.initialized');
    }
};

require(['app/controller', 'app/config'], function(Controller, config){
    var options = {manifest: config.manifest};
    var controller = new Controller(options, initialized);
});