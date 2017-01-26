(function () {
    'use strict';

    function wrapperController($scope, $rootScope, $location, $timeout, $cookies, HTTPService, adminAppModel, $mdToast, $mdDialog, $mdSidenav, deviceDetector){

        var ctrl = this;


        ctrl.modals = {
            signup: {
                controller: signupCtrl,
                template: 'admin/wrapper/templates/signupModal.html'
            },
            login: {
                controller: loginCtrl,
                template: 'admin/wrapper/templates/loginModal.html'
            },
            forgot: {
                controller: forgotCtrl,
                template: 'admin/wrapper/templates/forgotModal.html'
            },
            reset: {
                controller: resetCtrl,
                template: 'admin/wrapper/templates/resetModal.html'
            }
        };

        ctrl.getUserData = function() {
            var conduitSessionID = $cookies.get('conduitSessionID') || 'logged-out';

            HTTPService.post(adminAppModel.APIUrl + '/user', { sessionId: conduitSessionID }, function(success, response){
                if(success){

                    if(response.data && response.data.userData && response.data.userData.username){
                        ctrl.onUserDataReceived(response.data);
                    }else{
                        // ctrl.hideAllTemplates();
                        // ctrl.showChannelList = true;
                        ctrl.userData = undefined;
                        adminAppModel.userData = undefined;
                        adminAppModel.userDataReceived = true;
                        $rootScope.$broadcast('userDataReceived', {});
                    }

                    if(!ctrl.preventParseUrl){
                        $scope.parseUrl();
                    }else{
                        ctrl.preventParseUrl = false;
                    }
                    // else{
                    //     if(!ctrl.hideFirstTimeUserModal){
                    //         ctrl.showModal('login', true);
                    //     }
                    // }
                }else{
                    console.log('=========== failed ', response);
                }
            });
        };

        var getUserTimeout;
        ctrl.getUserDataWhenReady = function() {
            if(adminAppModel){
                ctrl.getUserData();
                $timeout.cancel(getUserTimeout);
            }else{
                getUserTimeout = $timeout(function() {
                    ctrl.getUserDataWhenReady();
                }, 200);
            }
        };
        ctrl.getUserDataWhenReady();
            
        

        ctrl.onUserDataReceived = function(data) {

            if(data && data.userData && data.userData.isCurator){
                ctrl.hideAllTemplates();
                ctrl.showCuratorDash = true;
            }
            // else{
            //     ctrl.hideAllTemplates();
            //     ctrl.showChannelList = true;
            // }

            adminAppModel.userDataReceived = true;
            adminAppModel.userData = data.userData;
            ctrl.userData = data.userData;
            adminAppModel.subscriptionStatus = data.subscriptionStatus;
            ctrl.subscriptionStatus = data.subscriptionStatus;
            $rootScope.$broadcast('userDataReceived', data);

        };

        ctrl.showModal = function(modalName, locals) {
            $mdDialog.show({
                controller: ctrl.modals[modalName].controller,
                templateUrl: ctrl.modals[modalName].template,
                parent: angular.element(document.body),
                // targetEvent: event,
                locals: locals
            });
        };

        ctrl.logout = function() {
            HTTPService.get(adminAppModel.APIUrl + '/user/logout', function(success, response){
                if(success){
                    $cookies.remove('conduitSessionID');
                    ctrl.getUserData();
                    ctrl.hideAllTemplates();
                    ctrl.showChannelList = true;
                    ctrl.showToaster('You are now logged out.');
                    // ctrl.onUserDataReceived(response.data.data);
                    // ctrl.hideAllTemplates();
                    // ctrl.showHome = true;

                }else{
                    console.log('=========== failed ', response);
                }
            });
        };

        ctrl.showToaster = function(msg) {
            $mdToast.show(
              $mdToast.simple()
                .content(msg)
                .position('top right')
                .hideDelay(3000)
            );
        };

    }

    wrapperController.$inject = ['$scope', '$rootScope', '$location', '$timeout', 'HTTPService', 'adminAppModel', '$mdToast', '$mdDialog', '$mdSidenav'];



    function signupCtrl($scope, $rootScope, $timeout, $mdDialog, $mdToast, $cookies, HTTPService, adminAppModel) {

        $scope.close = function() {
            $rootScope.$broadcast('hideModal');
        };

        $scope.submitSignupForm = function(data) {
            if(data.password !== data.confirmPassword){
                return $scope.showToaster('Please make sure the passwords match');
            }

            var invitingCuratorId = $cookies.get('conduitSharedLinkCuratorId');
            if(invitingCuratorId){
                data.invitingCuratorId = invitingCuratorId;
            }
                        
            var url = adminAppModel.APIUrl + '/user/signup';
            HTTPService.post(url, data, function(success, signupResponse){
                if(success){

                    if(!signupResponse.data.errors.length){
                        $scope.showUserExistsMessage = false;

                        // $scope.showToaster('Thank you - Welcome to Conduit!');
                        $rootScope.$broadcast('hideModal');

                        var user = {
                            username: data.email,
                            password: data.password,
                        };

                        HTTPService.post(adminAppModel.APIUrl + '/user/login', user, function(success, response){
                            if(success){

                                var sessionId = response.data.conduitSessionID;

                                $cookies.put('conduitSessionID', sessionId, {
                                    path: '/',
                                    expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1))  // One year from now
                                });

                                $rootScope.$broadcast('getUserData');

                                // var freeSetsUsed = $cookies.get('freeSetsUsed');
                                // if(freeSetsUsed && parseInt(freeSetsUsed) >= 10){
                                //     $rootScope.$broadcast('showSubscribe', true);  // Show max free sets message
                                // }else{
                                //     $rootScope.$broadcast('showSubscribe');
                                // }
                                
                            }else{
                                $scope.loginFailure = true;
                            }
                        });
                    }else{
                        $scope.showUserExistsMessage = true;
                    }

                }else{
                    $scope.showToaster('Sorry, there was a problem - please check your internet connection and try again.');
                }
            });
        };

        $scope.showLoginModal = function() {
            $rootScope.$broadcast('showLoginModal');
            $scope.close();
        };

        $scope.showToaster = function(msg) {
            $mdToast.show(
              $mdToast.simple()
                .content(msg)
                .position('top right')
                .hideDelay(3000)
            );
        };

    }

    signupCtrl.$inject = ['$scope', '$rootScope', '$timeout', '$mdDialog', '$mdToast', '$cookies', 'HTTPService', 'adminAppModel'];



    function loginCtrl($scope, $rootScope, $timeout, $mdDialog, $mdToast, $cookies, HTTPService, adminAppModel) {

        // setTimeout(function(){
        //     var backdropEl = document.getElementsByTagName('md-backdrop')[0];
        //     var backdrop = angular.element( backdropEl );
        //     backdrop.css({ 'background-color': '#ccc', 'opacity': '1', 'transition': 'none' });
        // });

        $scope.close = function(showLogin) {
            $rootScope.$broadcast('hideModal');
        };

        $scope.login = function(user) {
            HTTPService.post(adminAppModel.APIUrl + '/user/login', user, function(success, response){
                if(success){

                    var sessionId = response.data.conduitSessionID;

                    $cookies.put('conduitSessionID', sessionId, {
                        path: '/',
                        expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1))  // One year from now
                    });

                    $rootScope.$broadcast('getUserData', { preventParseUrl: true }); // passing 'true' to prevent parseURL() from running again
                    $scope.showToaster('Success logging in');
                    $scope.loginFailure = false;
                    $rootScope.$broadcast('hideModal');
                    $rootScope.$broadcast('loginSuccess');
                }else{
                    $scope.loginFailure = true;
                }
            });
        };

        $scope.showForgot = function() {
            $rootScope.$broadcast('hideModal');
            $rootScope.$broadcast('showForgotModal');
        };

        $scope.showToaster = function(msg) {
            $mdToast.show(
              $mdToast.simple()
                .content(msg)
                .position('top right')
                .hideDelay(3000)
            );
        };

    }

    loginCtrl.$inject = ['$scope', '$rootScope', '$timeout', '$mdDialog', '$mdToast', '$cookies', 'HTTPService', 'adminAppModel'];




    function forgotCtrl($scope, $rootScope, $timeout, $mdDialog, $mdToast, HTTPService, adminAppModel) {

        // setTimeout(function(){
        //     var backdropEl = document.getElementsByTagName('md-backdrop')[0];
        //     var backdrop = angular.element( backdropEl );
        //     backdrop.css({ 'background-color': '#ccc', 'opacity': '1', 'transition': 'none' });
        // });

        $scope.close = function(showLogin) {
            $rootScope.$broadcast('hideModal');
            if(showLogin){
                $rootScope.$broadcast('showLoginModal');
            }
        };

        $scope.submitForgotForm = function(data) {
           var url = adminAppModel.APIUrl + '/user/forgot/';
            HTTPService.post(url, data, function(success){
                if(success){
                    $scope.showForgotForm = false;
                    $scope.showToaster('Thank you - if this email address is associated with a Conduit account, we\'ll send an email with further instructions');
                    $scope.disableForgotForm = true;
                }else{
                    console.log('========== Error submitting forgot form');
                }
            });
        };

        $scope.showToaster = function(msg) {
            $mdToast.show(
              $mdToast.simple()
                .content(msg)
                .position('top right')
                .hideDelay(3000)
            );
        };

    }

    forgotCtrl.$inject = ['$scope', '$rootScope', '$timeout', '$mdDialog', '$mdToast', 'HTTPService', 'adminAppModel'];




    function resetCtrl($scope, $rootScope, $timeout, $location, $mdDialog, $mdToast, HTTPService, adminAppModel) {

        // setTimeout(function(){
        //     var backdropEl = document.getElementsByTagName('md-backdrop')[0];
        //     var backdrop = angular.element( backdropEl );
        //     backdrop.css({ 'background-color': '#ccc', 'opacity': '1', 'transition': 'none' });
        // });

        $scope.close = function() {
            $rootScope.$broadcast('hideModal');
            $rootScope.$broadcast('showLoginModal');
        };

        $scope.checkResetToken = function() {
            var url = $location.absUrl();
            var data = {
                resetToken: url.substring(url.lastIndexOf('/') + 1, url.length)
            };
            
            HTTPService.post(adminAppModel.APIUrl + '/user/reset/checktoken/', data, function(success, resetObj){
                if(success){
                    $scope.resetData = resetObj.data.data;
                    console.log('resetData = ', resetObj);
                }else{
                    $scope.showToaster('Sorry, we don\'t recognize your Password Reset Token');
                }
            });
        };
        $scope.checkResetToken();

        $scope.submitResetForm = function(data) {
           if(data.password !== data.confirmPassword){
                return $scope.showToaster('Please make sure the passwords match');
            }
            
            data.email = $scope.resetData.email;
            
            var url = adminAppModel.APIUrl + '/user/reset/';
            HTTPService.post(url, data, function(success, data){
                if(success){
                    $scope.showToaster('Password successfully reset!');
                    $scope.close();
                }else{
                    console.log('Error resetting password', data);
                }
            });
        };

        $scope.showToaster = function(msg) {
            $mdToast.show(
              $mdToast.simple()
                .content(msg)
                .position('top right')
                .hideDelay(3000)
            );
        };

    }

    resetCtrl.$inject = ['$scope', '$rootScope', '$timeout', '$location', '$mdDialog', '$mdToast', 'HTTPService', 'adminAppModel'];


    function sideNavCtrl($scope, $rootScope, $timeout, $location, $mdDialog, $mdToast, $mdSidenav, HTTPService) {

        $scope.$on('userDataReceived', function(event, data) {
            $scope.userData = data;
        });

        $scope.logOut = function() {
            $rootScope.$broadcast('logOut');
            $scope.close();
        };

        $scope.show = function(showWhat){
            switch(showWhat){
                case 'channels':
                    $rootScope.$broadcast('showChannels');
                    break;
                case 'curators':
                    $rootScope.$broadcast('showCurators');
                    break;
                case 'sets':
                    $rootScope.$broadcast('showSets');
                    break;
                case 'subscribe':
                    $rootScope.$broadcast('showSubscribe');
                    break;
                case 'myAccount':
                    $rootScope.$broadcast('showMyAccount');
                    break;
                case 'myMusic':
                    $rootScope.$broadcast('showMyMusic');
                    break;
                case 'logIn':
                    $rootScope.$broadcast('showLoginModal');
                    break;
                case 'createAccount':
                    $rootScope.$broadcast('showSignUpModal');
                    break;
                case 'curatorDash':
                    $rootScope.$broadcast('showCuratorDashboard');
                    break;
                case 'getTheApp':
                    $rootScope.$broadcast('showGetTheAppModal');
                    break;
            }

            $scope.close();
        };

        $scope.close = function() {
            $mdSidenav('right-nav').close();
        };

        

    }

    sideNavCtrl.$inject = ['$scope', '$rootScope', '$timeout', '$location', '$mdDialog', '$mdToast', '$mdSidenav', 'HTTPService'];

    function wrapperDirective() {
        return {
            restrict: 'E',
            templateUrl: 'admin/wrapper/wrapper.html',
            scope: {
            },
            controller: wrapperController,
            controllerAs: 'wrapperCtrl',
            bindToController: true
        };
    }

    angular.module('admin.components.wrapper')
        .directive('wrapper', wrapperDirective)
        .controller('sideNavCtrl', sideNavCtrl);
})();
