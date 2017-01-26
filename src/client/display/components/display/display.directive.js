(function () {
    'use strict';

    function displayController($scope, $rootScope, $location, $timeout, jsPlumbService, HTTPService) {

        var ctrl = this;

        // toolkit id
        var toolkitId = 'flowchartToolkit';
        var toolkit;

        window.jsps = jsPlumbService;
        window.ctrl = this;

        // var socket = io.connect();
        //     socket.on('newRandomNumberEvent', function (data) {
        //         console.log(data);
        //         toolkit.updateNode('decide', { sampleData: data });
        // });

        ctrl.backToDashboard = function() {
            $location.path('/');
            $rootScope.$broadcast('showDashboard');
        };
    
    
    ctrl.getDiagramJSON = function(reInit) {

        var absUrl = $location.absUrl();
        ctrl.diagramID = absUrl.substring(absUrl.lastIndexOf('/') + 1, absUrl.length);

        var url = '/diagram/getjson/' + ctrl.diagramID;
        HTTPService.get(url, function(success, response){
            if(success){

                ctrl.diagramName = response.data.diagramJSON.name;
                ctrl.diagramDescription = response.data.diagramJSON.description;
                ctrl.diagramJSON = JSON.parse(response.data.diagramJSON.diagramJSON);

                if(reInit){
                    return toolkit.load({
                        type: 'json',
                        data: ctrl.diagramJSON
                        // data: jsPlumbService.flowData
                    });
                }

                if(ctrl.readyToInit){
                    return  ctrl.initDiagram();
                }
                ctrl.readyToInit = true;

            }else{
                // TODO: Handle URLs with invalid diagram ID param or no ID param or no params at all
                console.log('=========== failed ', response);
            }
        });
    };
    ctrl.getDiagramJSON();

    // ---------------------------- operations on nodes, edges ---------------------------------------------------------

        var _editLabel = function(edge) {
            jsPlumbToolkit.Dialogs.show({
                id: 'dlgText',
                data: {
                    text: edge.data.label || ''
                },
                onOK: function (data) {
                    toolkit.updateEdge(edge, { label:data.text });
                }
            });
        };

    // ---------------------------- / operations on nodes, edges ---------------------------------------------------------

        //
        // scope contains
        // jtk - the toolkit
        // surface - the surface
        //
        // element is the DOM element into which the toolkit was rendered
        //
        this.init = function(scope, element, attrs) {

            ctrl.initScope = scope;
            ctrl.initElement = element;
            ctrl.initAttrs = attrs;

            if(ctrl.readyToInit){
                return  ctrl.initDiagram();
            }
            ctrl.readyToInit = true;
        };

        this.initDiagram = function() {
            toolkit = ctrl.initScope.toolkit;

            toolkit.load({
                type: 'json',
                data: ctrl.diagramJSON
                // data: jsPlumbService.flowData
            });

            // -------------- configure buttons --------------------------------

            var controls = ctrl.initElement[0].querySelector('.controls');
            // listener for mode change on renderer.
            ctrl.initScope.surface.bind('modeChanged', function (mode) {
                jsPlumb.removeClass(controls.querySelectorAll('[mode]'), 'selected-mode');
                jsPlumb.addClass(controls.querySelectorAll('[mode=\'\' + mode + \'\']'), 'selected-mode');
            });

            // pan mode/select mode
            jsPlumb.on(controls, 'tap', '[mode]', function () {
                ctrl.initScope.surface.setMode(this.getAttribute('mode'));
            });

            // on home button click, zoom content to fit.
            jsPlumb.on(controls, 'tap', '[reset]', function () {
                ctrl.initScope.toolkit.clearSelection();
                ctrl.initScope.surface.zoomToFit();
            });

            // configure Drawing tools. This is an optional include.
            new jsPlumbToolkit.DrawingTools({
                renderer: ctrl.initScope.surface
            });

            // initialize dialogs
            jsPlumbToolkit.Dialogs.initialize({
                selector: '.dlg'
            });

            //
            // any operation that caused a data update (and would have caused an autosave), fires a dataUpdated event.
            //
            toolkit.unbind('dataUpdated');
            toolkit.bind('dataUpdated', _updateDataset);
        }


    // ----------------------------- data for the app ----------------------------------------------------------

        $scope.nodeTypes = [
            {label: 'Question', type: 'question'},
            {label: 'Action', type: 'action' },
            {label: 'Output', type: 'output' }
        ];

        $scope.removeNode = function (node) {
            var info = this.surface.getObjectInfo(node);
            jsPlumbToolkit.Dialogs.show({
                id: 'dlgConfirm',
                data: {
                    msg: 'Delete \'\' + info.obj.text + \'\''
                },
                onOK: function () {
                    toolkit.removeNode(info.obj);
                }
            });
        };

        $scope.editNode = function (node) {
            // getObjectInfo is a method that takes some DOM element (this function's `this` is
            // set to the element that fired the event) and returns the toolkit data object that
            // relates to the element. it ascends through parent nodes until it finds a node that is
            // registered with the toolkit.
            var info = this.surface.getObjectInfo(node);
            jsPlumbToolkit.Dialogs.show({
                id: 'dlgText',
                data: info.obj,
                title: 'Edit ' + info.obj.type + ' name',
                onOK: function (data) {
                    if (data.text && data.text.length > 2) {
                        // if name is at least 2 chars long, update the underlying data and
                        // update the UI.
                        toolkit.updateNode(info.obj, data);
                    }
                }
            });
        };

    // -------------------------------- render parameters ---------------------------------------------------

        this.typeExtractor = function (el) {
            return el.getAttribute('jtk-node-type');
        };

        var nodeDimensions = {
            question:{ w: 120, h: 120 },
            action:{ w: 120, h: 70 },
            start:{ w: 50,h: 50 },
            output:{ w:120, h:70 }
        };

        this.toolkitParams = {
            nodeFactory: function (type, data, callback) {
                jsPlumbToolkit.Dialogs.show({
                    id: 'dlgText',
                    title: 'Enter ' + type + ' name:',
                    onOK: function (d) {
                        data.text = d.text;
                        // if the user entered a name...
                        if (data.text) {
                            // and it was at least 2 chars
                            if (data.text.length >= 2) {
                                // set width and height.
                                jsPlumb.extend(data, nodeDimensions[type]);
                                // set an id and continue.
                                data.id = jsPlumbToolkitUtil.uuid();
                                callback(data);
                            }
                            else
                            // else advise the user.
                                alert(type + ' names must be at least 2 characters!');
                        }
                        // else...do not proceed.
                    }
                });
            },
            beforeStartConnect:function(node, edgeType) {
                return { label:'...' };
            }
        };

        this.renderParams = {
            elementsDraggable: false,
            view: {
                nodes: {
                    'start': { 
                        template: 'start'
                    },
                    'selectable': {},
                    'question': {
                        parent: 'selectable',
                        template: 'question'
                    },
                    'action': {
                        parent: 'selectable',
                        template: 'action'
                    },
                    'output':{
                        parent:'selectable',
                        template:'output'
                    }
                },
                // There are two edge types defined - 'yes' and 'no', sharing a common
                // parent.
                edges: {
                    'default': {
                        anchor:'AutoDefault',
                        endpoint:'Blank',
                        connector: ['Flowchart', { cornerRadius: 5 } ],
                        paintStyle: { lineWidth: 2, strokeStyle: '#f76258', outlineWidth: 3, outlineColor: 'transparent' }, //  paint style for this edge type.
                        hoverPaintStyle: { lineWidth: 2, strokeStyle: 'rgb(67,67,67)' }, // hover paint style for this edge type.
                        events: {},
                        overlays: [
                            [ 'Arrow', { location: 1, width: 10, length: 10 }],
                            [ 'Arrow', { location: 0.3, width: 10, length: 10 }]
                        ]
                    },
                    'connection':{
                        parent:'default',
                        overlays:[
                            [
                                'Label', {
                                    label: '${label}',
                                    events:{}
                                }
                            ]
                        ]
                    }
                },

                ports: {
                    'start': {
                        endpoint: 'Blank',
                        anchor: 'Continuous',
                        uniqueEndpoint: true,
                        edgeType: 'default'
                    },
                    'source': {
                        endpoint: 'Blank',
                        paintStyle: {fillStyle: '#84acb3'},
                        anchor: 'AutoDefault',
                        maxConnections: -1,
                        edgeType: 'connection'
                    },
                    'target': {
                        maxConnections: -1,
                        endpoint: 'Blank',
                        anchor: 'AutoDefault',
                        paintStyle: {fillStyle: '#84acb3'},
                        isTarget: true
                    }
                }
            },
            // Layout the nodes using an absolute layout
            layout: {
                type: 'Absolute'
            },
            events: {
                canvasClick: function (e) {
                    toolkit.clearSelection();
                }
            },
            consumeRightClick: false,
            dragOptions: {
                filter: '.jtk-draw-handle, .node-action, .node-action i'
            }
        };

    // ---------------- update data set -------------------------
        var _syntaxHighlight = function (json) {
            json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return '<pre>' + json.replace(/('(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\'])*'(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                var cls = 'number';
                if (/^'/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'key';
                    } else {
                        cls = 'string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'boolean';
                } else if (/null/.test(match)) {
                    cls = 'null';
                }
                return '<span class=\'\' + cls + \'\'>' + match + '</span>';
            }) + '</pre>';
        };

        var pageLoadTimeout;
        var datasetContainer = document.querySelector('.jtk-demo-dataset');
        var _updateDataset = function () {

            var dataUpdate = JSON.stringify(toolkit.exportData(), null, 4);

            // pageLoadTimeout prevents the unnecessary 'update' calls from bombarding the server on page load
            if(pageLoadTimeout){  

                var diagramString = angular.copy(dataUpdate)
                var diagramObj = JSON.parse(diagramString);

                delete diagramObj.ports;

                var deDupedEdgeArray = deDupeEdgeArray(diagramObj.edges);

                var fixedDiagramObj = {
                    nodes: diagramObj.nodes,
                    edges: deDupedEdgeArray
                };

                var newDiagramString = JSON.stringify(fixedDiagramObj);

                if(!angular.equals(newDiagramString, ctrl.previousDiagramString)){

                    ctrl.previousDiagramString = newDiagramString;

                    var dataToSave = {
                        _id: ctrl.diagramID,
                        diagramJSON: newDiagramString
                    }

                    HTTPService.post('/diagram/update', {data: dataToSave}, function(success, response){
                        if(success){
                            // TODO: Show 'All changes saved...' on success
                            console.log('============ successful! ', response);
                        }else{
                            // TODO: Show warning saying we've lost contact with the server and changes may not be saved
                            console.log('=========== failed ', response);
                        }
                    });
                }
            }

            setTimeout(function(){
                pageLoadTimeout = true;
            }, 5000);

            // datasetContainer.innerHTML = _syntaxHighlight(dataUpdate);
        };

        function deDupeEdgeArray(origArr){
            var newArr = [],
                origLen = origArr.length,
                found, x, y;

            for (x = 0; x < origLen; x++) {
                found = undefined;
                for (y = 0; y < newArr.length; y++) {
                    if (origArr[x].data.id === newArr[y].data.id) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    newArr.push(origArr[x]);
                }
            }
            return newArr;
        }


    }

    displayController.$inject = ['$scope', '$rootScope', '$location', '$timeout', 'jsPlumbService', 'HTTPService'];

    function displayDirective() {
        return {
            restrict: 'E',
            templateUrl: '/src/client/display/components/display/templates/display.html',
            scope: {
            },
            controller: displayController,
            controllerAs: 'displayCtrl',
            bindToController: true
        };
    }

    function startDirective(jsPlumbFactory) {
        return jsPlumbFactory.node({
            templateUrl: '/src/client/display/components/display/templates/start_template.tpl',
            link:function(scope, element) {
                element.addClass('flowchart-object flowchart-start');
            }
        });
    }

    function questionDirective(jsPlumbFactory) {
        return jsPlumbFactory.node({
            inherit:['removeNode', 'editNode'],
            templateUrl: '/src/client/display/components/display/templates/question_template.tpl',
            link:function(scope, element) {
                element.addClass('flowchart-object flowchart-question');
            }
        });
    }

    function actionDirective(jsPlumbFactory) {
        return jsPlumbFactory.node({
            inherit:['removeNode', 'editNode'],
            templateUrl: '/src/client/display/components/display/templates/action_template.tpl',
            link:function(scope, element) {
                element.addClass('flowchart-object flowchart-action');
            }
        });
    }

    function outputDirective(jsPlumbFactory) {
        return jsPlumbFactory.node({
            inherit:['removeNode', 'editNode'],
            templateUrl: '/src/client/display/components/display/templates/output_template.tpl',
            link:function(scope, element) {
                element.addClass('flowchart-object flowchart-output');
            }
        });
    }

    angular.module('display.components.display')
        .directive('start', startDirective)
        .directive('question', questionDirective)
        .directive('action', actionDirective)
        .directive('output', outputDirective)
        .directive('display', displayDirective);
})();
