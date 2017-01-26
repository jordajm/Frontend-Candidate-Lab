(function () {
    'use strict';

    // define the applications main module inject all other modules
    angular.module('admin', [
        'ngMaterial',
        'admin.components',
        'admin.services'
    ]);

})();
