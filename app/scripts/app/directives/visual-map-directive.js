(function() {
    'use strict';

    angular.module('app')
        .directive('visualMap', function() {
                return {
                    restrict: 'EA',
                    scope: {
                        cityData: '=',
                        routeData: '='
                    },
                    replace: true,
                    templateUrl: 'partials/directives/world-map.html',
                    controller: ['$scope', '$window', function($scope, $window) {

                        var _ctrl = this,
                            _margin = {
                                top: 30,
                                right: 30,
                                bottom: 75,
                                left: 30
                            },
                            _salesData = null,
                            _$element = null,
                            _elDimensions = {
                                width: 0,
                                height: 0
                            },
                            _line = null,
                            _lineArea = null,
                            _lineAreaPath = null,
                            _lineFn = null,
                            _tipFn = null,
                            _axis = {
                                x: null,
                                y: null
                            },
                            _scales = {
                                x: null,
                                y: null
                            },
                            _scaleTicks = {
                                x: 12,
                                y: 4
                            },
                            _svg = null,
                            _groups = {
                                title: null,
                                xAxis: null,
                                yAxis: null,
                                graphCanvas: null
                            };

                        /* Constants */
                        var AXIS_TICK_SIZE = 4,
                            SVG_MAP_ASPECT_RATIO = 2250/3000,
                            MONTHS_LOOKUP = [
                                'January', 'February', 'March',
                                'April', 'May', 'June', 'July',
                                'August', 'September', 'October',
                                'November', 'December'
                            ];

                        function _debounce(f, timeInMS) {

                            var timeoutHandle = null;

                            return function() {

                                if (timeoutHandle) {
                                    $window.clearTimeout(timeoutHandle);
                                }

                                timeoutHandle = $window.setTimeout(f, timeInMS);
                            };

                        }

                        function _updateGraphAttrs() {
                            _elDimensions.width = _$element.parent().outerWidth();
                            _elDimensions.height = _$element.parent().outerHeight();

                            var drawingWidth = _elDimensions.width - _margin.left - _margin.right,
                                drawingHeight = _elDimensions.height - _margin.top - _margin.bottom;

                            _scales.x.range([0, drawingWidth]);
                            _scales.y.range([drawingHeight, 0]);

                            _axis.x.scale(_scales.x);
                            _axis.y.scale(_scales.y);


                            console.log(_elDimensions);
                        }

                        _ctrl.render = function(salesData) {

                            if (!_svg) {
                                throw new Error('Could not find associated SVG for line graph!\nAre you sure you initialized it?');
                            }


                            _svg
                                .attr('width', _elDimensions.width)
                                .attr('height', Math.round(_elDimensions.width * SVG_MAP_ASPECT_RATIO));

                            if (angular.isDefined(salesData)) {
                                _salesData = salesData;
                            }

                            if (!angular.isArray(_salesData)) {
                                return;
                            }

                            _scales.x.domain(d3.extent(_salesData, function(d) {
                                return d.dateStart;
                            }));

                            var maxYPoint = d3.max(_salesData, function(d) {
                                return d.count;
                            });

                            _scales.y.domain([0, maxYPoint]);

                            // Define line drawing function
                            _lineFn
                                .x(function(d) {
                                    return _scales.x(d.dateStart);
                                })
                                .y(function(d) {
                                    return _scales.y(d.count);
                                });



                            // Define and draw X,Y axis
                            _axis.x.scale(_scales.x);
                            _axis.y.scale(_scales.y);

                            _groups.xAxis.attr('transform', 'translate(0,' +
                                    (_elDimensions.height - _margin.top - _margin.bottom) + ')')
                                //.call(_axis.x)
                                .selectAll('text')
                                .attr('y', 9)
                                .attr('x', 9)
                                .attr('dy', '.35em')
                                .attr('transform', 'rotate(45)')
                                .style('text-anchor', 'start');

                            _groups.yAxis.attr('transform', 'translate(0,0)');
                                //.call(_axis.y);


                            // Draw points
                            var salesPoints = _groups.graphCanvas.selectAll('circle.data-point')
                                .data(_salesData);

                            salesPoints.enter().append('circle')
                                .classed('data-point', true)
                                .on('mouseover', function(d) {
                                    _tipFn.attr('class', 'd3-tip animate').show(d);
                                })
                                .on('mouseout', function(d) {
                                    _tipFn.attr('class', 'd3-tip').hide(d);
                                });

                            salesPoints
                                .attr('cx', function(d) {
                                    return _scales.x(d.dateStart);
                                })
                                .attr('cy', function() {
                                    return _scales.y(0);
                                })
                                .attr('r', 0)
                                .transition()
                                .attr('cy', function(d) {
                                    return _scales.y(d.count);
                                })
                                .attr('r', 2);

                            salesPoints.exit().remove();

                        };

                        _ctrl.init = function($element) {

                            _$element = $element;

                            _scales.x = d3.time.scale();
                            _scales.y = d3.scale.linear();

                            _lineFn = d3.svg.line();
                            //.interpolate('monotone');

                            _axis.x = d3.svg.axis()
                                .ticks(_scaleTicks.x)
                                .tickSize(AXIS_TICK_SIZE)
                                .outerTickSize(0)
                                .tickFormat(d3.time.format('%b %e, %Y'))
                                .orient('bottom');

                            _axis.y = d3.svg.axis()
                                .ticks(_scaleTicks.y)
                                .tickSize(AXIS_TICK_SIZE)
                                .outerTickSize(0)
                                .orient('left');

                            //Mouseover tip
                            _tipFn = d3.tip()
                                .direction('n')
                                .attr('class', 'd3-tip')
                                .offset([-10, 0])
                                .html(function(d) {
                                    var saleDate = d.dateStart;
                                    return '<p><strong>' + d.count + ' ' +
                                        'sales</strong> made on ' +
                                        MONTHS_LOOKUP[saleDate.getMonth()] + ' ' +
                                        saleDate.getDate() + ', ' +
                                        saleDate.getFullYear() +
                                        '</p>';
                                });

                            _updateGraphAttrs();

                            if (!_svg) {
                                // SVG Object initialization...
                                _svg = d3.select('svg.world-map');

                                //_svg.attr('viewBox', '0 0 ' + _elDimensions.width + ' ' + _elDimensions.height);

                                _groups.graphCanvas = _svg.append('g')
                                    .classed('graph-canvas', true)
                                    .attr('transform', 'translate(' + _margin.left + ',' + _margin.top + ')');

                                _groups.graphCanvas.call(_tipFn);

                                _groups.title = _groups.graphCanvas.append('g')
                                    .classed('title-text-group', true);


                                _groups.xAxis = _groups.graphCanvas.append('g')
                                    .classed('x axis', true);

                                _groups.yAxis = _groups.graphCanvas.append('g')
                                    .classed('y axis', true);


                                // Listeners...
                                var resize = $window.attachEvent ?
                                    function(f) {
                                        return $window.attachEvent('onresize', f);
                                    } :
                                    function(f) {
                                        return $window.addEventListener('resize', f);
                                    };

                                var debouncedUpdate = _debounce(function() {
                                    _updateGraphAttrs();
                                    _ctrl.render();
                                }, 350);

                                resize(debouncedUpdate);
                                debouncedUpdate();

                                $scope.$on('$destroy', function() {
                                    var removeEvent =  $window.detachEvent ?
                                        function(f) {
                                            $window.detachEvent('onresize', f);
                                        } :
                                        function(f) {
                                            $window.removeEventListener('resize', f);
                                        };

                                    removeEvent(debouncedUpdate);
                                });

                            }

                        };

                    }],
                    link: function(scope, element, attrs, salesLineGraphCtrl) {

                        // Assume salesData is either a function that returns the data or is the data itself...
                        var salesDataFn = angular.isFunction(scope.salesData) ?
                            scope.salesData : function() {
                            return scope.salesData;
                        };

                        salesLineGraphCtrl.init(element);

                        scope.$watch(salesDataFn, function(newData) {
                            if (!newData) {
                                return;
                            }

                            salesLineGraphCtrl.render(newData);
                        });
                    }
                };
            }
        );
})();
