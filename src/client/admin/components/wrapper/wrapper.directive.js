(function () {
    'use strict';

    function wrapperController($scope, $rootScope, $location, $timeout, HTTPService, adminAppModel, $mdToast, $mdDialog, $mdSidenav){

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
            createNote: {
                controller: createNoteCtrl,
                template: 'admin/wrapper/templates/createNoteModal.html'
            },
            editNote: {
                controller: editNoteCtrl,
                template: 'admin/wrapper/templates/editNoteModal.html'
            },
            viewNotes: {
                controller: viewNotesCtrl,
                template: 'admin/wrapper/templates/viewNotesModal.html'
            },
            handleClick: {
                controller: handleClickCtrl,
                template: 'admin/wrapper/templates/handleClickModal.html'
            }
        };

        $scope.$on('showSignUpModal', function() {
            ctrl.showModal('signup');
        });

        $scope.$on('showLoginModal', function() {
            ctrl.showModal('login');
        });

        $scope.$on('hideModal', function() {
            $mdDialog.hide();
        });

        $scope.$on('getUserData', function() {
            ctrl.getUserData();
        });

        $scope.$on('logOut', function() {
            ctrl.logout();
        });

        $scope.$on('showNewNoteModal', function() {
            ctrl.showModal('createNote');
        });

        $scope.$on('showViewNotesModal', function() {
            ctrl.showModal('viewNotes');
        });

        $scope.$on('showEditNote', function(event, data) {
            ctrl.showModal('editNote', { noteData: data.noteData });
        });

        ctrl.showSideNav = function() {
            $mdSidenav('right-nav').toggle();
            if(adminAppModel && adminAppModel.userData && !adminAppModel.userData.isCurator){
                ctrl.preventParseUrl = true;
                $rootScope.$broadcast('getUserData');
            }
        };

        ctrl.getUserData = function() {
            HTTPService.get('/user', function(success, response){
                if(success){
                    if(response.data && response.data.userData && response.data.userData.username){
                        adminAppModel.userData = response.data.userData;
                        ctrl.userData = response.data.userData;
                        ctrl.username = adminAppModel.userData.username;
                    }else{
                        adminAppModel.userData = undefined;
                    }
                }else{
                    console.log('=========== failed ', response);
                }
            });
        };
        ctrl.getUserData();

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
                    adminAppModel.userData = undefined;
                    ctrl.userData = undefined;
                    ctrl.username = undefined;
                    ctrl.showToaster('You are now logged out.');
                }else{
                    console.log('=========== failed ', response);
                }
            });
        };

        ctrl.handleYesClick = function() {
            ctrl.showModal('handleClick', { yesAnswer: true });
        };

        ctrl.handleNoClick = function() {
            ctrl.showModal('handleClick', { yesAnswer: false });
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



    function signupCtrl($scope, $rootScope, $timeout, $mdDialog, $mdToast, HTTPService, adminAppModel) {

        $scope.close = function() {
            $rootScope.$broadcast('hideModal');
        };

        $scope.submitSignupForm = function(data) {
            if(data.password !== data.confirmPassword){
                return $scope.showToaster('Please make sure the passwords match');
            }
                        
            var url = adminAppModel.APIUrl + '/user/signup';
            HTTPService.post(url, data, function(success, signupResponse){
                if(success){

                    if(!signupResponse.data.errors.length){
                        $scope.showUserExistsMessage = false;

                        $rootScope.$broadcast('hideModal');
                        $scope.showToaster('Welcome!');

                        var user = {
                            username: data.email,
                            password: data.password,
                        };

                        HTTPService.post(adminAppModel.APIUrl + '/user/login', user, function(success, response){
                            if(success){

                                $rootScope.$broadcast('getUserData');
                                
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

    signupCtrl.$inject = ['$scope', '$rootScope', '$timeout', '$mdDialog', '$mdToast', 'HTTPService', 'adminAppModel'];



    function loginCtrl($scope, $rootScope, $timeout, $mdDialog, $mdToast, HTTPService) {

        $scope.close = function() {
            $rootScope.$broadcast('hideModal');
        };

        $scope.login = function(user) {
            $scope.disableSubmit = true;

            HTTPService.post('/user/login', user, function(success, response){
                if(success){
                    $scope.disableSubmit = false;
                    $rootScope.$broadcast('getUserData', { newLogin: true });
                    $scope.showToaster('Success logging in');
                    $scope.loginFailure = false;
                    $rootScope.$broadcast('hideModal');
                }else{
                    $scope.disableSubmit = false;
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

    loginCtrl.$inject = ['$scope', '$rootScope', '$timeout', '$mdDialog', '$mdToast', 'HTTPService'];


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
                case 'logIn':
                    $rootScope.$broadcast('showLoginModal');
                    break;
                case 'createAccount':
                    $rootScope.$broadcast('showSignUpModal');
                    break;
                case 'newNote':
                    $rootScope.$broadcast('showNewNoteModal');
                    break;
                case 'viewNotes':
                    $rootScope.$broadcast('showViewNotesModal');
                    break;
            }

            $scope.close();
        };

        $scope.close = function() {
            $mdSidenav('right-nav').close();
        };

    }

    sideNavCtrl.$inject = ['$scope', '$rootScope', '$timeout', '$location', '$mdDialog', '$mdToast', '$mdSidenav', 'HTTPService'];

    
    function createNoteCtrl($scope, $rootScope, $timeout, $mdDialog, $mdToast, HTTPService, adminAppModel) {

        $scope.close = function() {
            $rootScope.$broadcast('hideModal');
        };

        $scope.createNote = function(noteData) {
            noteData.accountId = adminAppModel.userData._id;

            HTTPService.post('/notes/create', noteData, function(success, response){
                if(success){
                    $scope.close();
                    $scope.showToaster('Success - Note created');
                }else{
                    console.log('Error: ', response);
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

    createNoteCtrl.$inject = ['$scope', '$rootScope', '$timeout', '$mdDialog', '$mdToast', 'HTTPService', 'adminAppModel'];

    function editNoteCtrl($scope, $rootScope, $timeout, $mdDialog, $mdToast, HTTPService, adminAppModel, noteData) {

        $scope.noteData = angular.copy(noteData);

        $scope.close = function() {
            $rootScope.$broadcast('hideModal');
        };

        $scope.editNote = function(noteData) {
            HTTPService.post('/notes/update', noteData, function(success, response){
                if(success){
                    $scope.close();
                    $scope.showToaster('Success - Note edited');
                }else{
                    console.log('Error: ', response);
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

    editNoteCtrl.$inject = ['$scope', '$rootScope', '$timeout', '$mdDialog', '$mdToast', 'HTTPService', 'adminAppModel', 'noteData'];


    function viewNotesCtrl($scope, $rootScope, $timeout, $mdDialog, $mdToast, HTTPService, adminAppModel) {

        $scope.close = function() {
            $rootScope.$broadcast('hideModal');
        };

        $scope.getNotes = function() {
            HTTPService.post('/notes', { noteIds: adminAppModel.userData.noteIds }, function(success, response){
                if(success){
                    $scope.notes = response.data.notes;
                }else{
                    console.log('Error: ', response);
                }
            });
        };
        $scope.getNotes();

        $scope.editNote = function(noteData) {
            $scope.close();
            $rootScope.$broadcast('showEditNote', { noteData: noteData });
        };

        $scope.deleteNote = function(noteData) {
            var confirm = $mdDialog.confirm()
                  .title('Are you sure you want to delete this note?')
                  .textContent('This can\'t be undone.')
                  .ariaLabel('Confirm delete')
                  // .targetEvent(event)
                  .ok('Yes, Delete It')
                  .cancel('No, Don\'t Delete');
            $mdDialog.show(confirm).then(function() {

                var deleteData = {
                    noteId: noteData._id,
                    accountId: adminAppModel.userData._id
                };

                HTTPService.post('/notes/delete', deleteData, function(success, response){
                    if(success){
                        $scope.getNotes();
                        $scope.showToaster('Success - note deleted');
                    }else{
                        console.log('Error: ', response);
                    }
                });
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

    viewNotesCtrl.$inject = ['$scope', '$rootScope', '$timeout', '$mdDialog', '$mdToast', 'HTTPService', 'adminAppModel'];


    function handleClickCtrl($scope, $rootScope, $timeout, $mdDialog, $mdToast, HTTPService, adminAppModel, yesAnswer) {

        $scope.isYesClick = yesAnswer;

        $scope.close = function() {
            $rootScope.$broadcast('hideModal');
        };

        $scope.submitEmail = function() {
            $scope.close();
            $scope.showToaster('Thanks - check your email!');
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

    handleClickCtrl.$inject = ['$scope', '$rootScope', '$timeout', '$mdDialog', '$mdToast', 'HTTPService', 'adminAppModel', 'yesAnswer'];



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
