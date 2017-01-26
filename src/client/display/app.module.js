(function () {
    'use strict';

    // define the applications main module inject all other modules
    angular.module('display', [
        'display.components',
        'display.services'
    ]);
})();
