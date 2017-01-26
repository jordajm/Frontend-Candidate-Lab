angular.module('display.services.http')

.factory('HTTPService', ['$http', function($http) {
  
  return {

    get: function(url, callback) {
      $http({
        method: 'GET',
        url: url
      }).then(function successCallback(response) {
          callback(true, response);
        }, function errorCallback(response) {
          callback(false, response);
        });
    },

    post: function(url, data, callback){
      $http({
        method: 'POST',
        url: url,
        data: data
      }).then(function successCallback(response) {
          callback(true, response);
        }, function errorCallback(response) {
          callback(false, response);
        });
    }

  };

}]);