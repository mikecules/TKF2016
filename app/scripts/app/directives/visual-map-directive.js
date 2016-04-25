(function() {
    'use strict';

    angular.module('app')
        .directive('visualMap', function() {
                return {
                    restrict: 'EA',
                    scope: {
                        mapData: '='
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
                            _mapData = null,
                            _$element = null,
                            _elDimensions = {
                                width: 0,
                                height: 0
                            },
                            _line = null,
                            _lineFn = null,
                            _tipFn = null,
                            _scales = {
                                x: null,
                                y: null
                            },
                            _svg = null,
                            _groups = {
                                title: null,
                                xAxis: null,
                                yAxis: null,
                                graphCanvas: null
                            };

                        /* Constants */
                        var SVG_MAP_ASPECT_RATIO = 2250/3000,
                            MAP_LONGITUDE_DOMAIN = [-180, 180],
                            MAP_LATITUDE_DOMAIN = [90, -90];

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

                            _scales.x.range([0, _elDimensions.width]);
                            _scales.y.range([0, _elDimensions.width * SVG_MAP_ASPECT_RATIO]);


                            console.log(_elDimensions);
                        }

                        _ctrl.render = function(mapData) {

                            if (!_svg) {
                                throw new Error('Could not find associated SVG for line graph!\nAre you sure you initialized it?');
                            }


                            _svg
                                .attr('width', _elDimensions.width)
                                .attr('height', Math.round(_elDimensions.width * SVG_MAP_ASPECT_RATIO));

                            if (angular.isDefined(mapData)) {
                                _mapData = mapData;
                            }


                            _scales.x.domain(MAP_LONGITUDE_DOMAIN); // 0, width
                            _scales.y.domain(MAP_LATITUDE_DOMAIN); // 0, height


                            // Draw points
                            var cityPoints = _groups.graphCanvas.selectAll('circle.data-point')
                                .data(_mapData.mapPoints);

                            cityPoints.enter().append('circle')
                                .classed('data-point', true)
                                .on('mouseover', function(d) {
                                    _tipFn.attr('class', 'd3-tip animate').show(d);
                                })
                                .on('mouseout', function(d) {
                                    _tipFn.attr('class', 'd3-tip').hide(d);
                                });

                            cityPoints
                                .attr('cx', function(d) {
                                    console.log('Long:', d.Long, _scales.x(d.Long));
                                    return _scales.x(d.Long) * 3000/_elDimensions.width;
                                })
                                .attr('cy', function(d) {
                                    console.log('Lat: ', d.Lat, _scales.y(d.Lat));
                                    return _scales.y(d.Lat) * 2250/+_svg.attr('height');
                                })
                                .attr('r', 0)
                                .transition()
                                .attr('r', 5);

                            cityPoints.exit().remove();

                        };

                        _ctrl.init = function($element) {

                            _$element = $element;

                            _scales.x = d3.scale.linear();
                            _scales.y = d3.scale.linear();

                            _lineFn = d3.svg.line();
                            //.interpolate('monotone');


                            //Mouseover tip
                            _tipFn = d3.tip()
                                .direction('n')
                                .attr('class', 'd3-tip')
                                .offset([-10, 0])
                                .html(function(d) {
                                  console.log(d);
                                    return '<strong>' + d.Institution + '</strong>' +
                                        '<p>' + d.Address + '</p>' +
                                        '<p>Lat: ' + d.Lat + '<br />' +
                                        'Long: ' + d.Long + '</p>';
                                });

                            _updateGraphAttrs();

                            if (!_svg) {
                                // SVG Object initialization...
                                _svg = d3.select('svg.world-map');

                                //_svg.attr('viewBox', '0 0 ' + _elDimensions.width + ' ' + _elDimensions.height);

                                _groups.graphCanvas = _svg.append('g')
                                    .classed('graph-canvas', true)
                                    .attr('transform', 'translate(' + -30 + ',' + 160+ ')');

                              _groups.graphCanvas.call(_tipFn);


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
                    link: function(scope, element, attrs, mapCtrl) {

                        // Assume salesData is either a function that returns the data or is the data itself...
                        var mapDataFn = angular.isFunction(scope.mapData) ?
                            scope.mapData : function() {
                            return scope.mapData;
                        };

                        mapCtrl.init(element);

                        scope.$watch(mapDataFn, function(newData) {
                            if (!newData) {
                                return;
                            }

                            mapCtrl.render(newData);
                        });
                    }
                };
            }
        );
})();
