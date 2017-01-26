(function() {
    'use strict';

    function appModel($rootScope, $location) {

        function getAPIUrl(){
            var url = $location.absUrl();
            if(url.indexOf('localhost') >= 0){
                return '';
            }else if(url.indexOf('staging') >= 0){
                // return 'https://?????';
            }else{
                return 'https://conduitmusic.co';
            }
        }

        function getAPICacheUrl() {
            var url = $location.absUrl();
            if(url.indexOf('localhost') >= 0){
                return '';
            }else if(url.indexOf('staging') >= 0){
                // return 'https://????';
            }else{
                return 'https://d2ljezmo5lkbtt.cloudfront.net';
            }
        }

        function isDev(){
            var url = $location.absUrl();
            if(url.indexOf('localhost') >= 0){
                return true;
            }else{
                return false;
            }
        }
        
        var model = {
            userDataReceived: false,
            userData: undefined,
            cloudfrontImageUrl: 'https://d3itspfsh9cmg0.cloudfront.net/',
            APIUrl: getAPIUrl(),
            APICacheUrl: getAPICacheUrl(),
            isDev: isDev(),
        };

        return model;
    }

    appModel.$inject = ['$rootScope', '$location'];

    angular.module('admin')
        .factory('adminAppModel', appModel);
})();
