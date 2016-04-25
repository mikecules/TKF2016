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
                            _mapData = null,
                            _$element = null,
                            _elDimensions = {
                                width: 0,
                                height: 0
                            },
                            _tipFn = null,
                            _svg = null,
                            _projection = null,
                            _groups = {
                                mapCanvas: null,
                            };

                        /* Constants */
                        var SVG_MAP_ASPECT_RATIO = 1/1.33;

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
                            _elDimensions.height = Math.round(_elDimensions.width * SVG_MAP_ASPECT_RATIO);

                            console.log(_elDimensions);
                        }

                        _ctrl.render = function(mapData) {

                            if (!_svg) {
                                throw new Error('Could not find associated SVG for line graph!\nAre you sure you initialized it?');
                            }


                            _svg
                                .attr('width', _elDimensions.width)
                                .attr('height', _elDimensions.height);

                            if (angular.isDefined(mapData)) {
                                _mapData = mapData;
                            }



                            // Draw points
                            var cityPoints = _groups.mapCanvas.selectAll('circle.data-point')
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
                                    console.log('Long:', d.Long);
                                    return _projection([d.Long, d.Lat])[0];
                                })
                                .attr('cy', function(d) {
                                    console.log('Lat: ', d.Lat);
                                    return _projection([d.Long, d.Lat])[1];
                                })
                                .attr('r', 0)
                                .transition()
                                .attr('r', 2);

                            cityPoints.exit().remove();

                        };

                        _ctrl.init = function($element) {

                            _$element = $element;

                            //Mouseover tip
                            _tipFn = d3.tip()
                                .direction('n')
                                .attr('class', 'd3-tip animate')
                                .offset([-10, 0])
                                .html(function(d) {
                                  console.log(d);
                                    return '<strong>' + d.Institution + '</strong> <hr />' +
                                        '<p style="text-align: left"><strong>Latitude</strong>: ' + d.Lat + '<br />' +
                                        '<strong>Longitude</strong>: ' + d.Long + '</p>' +
                                        '<p style="text-align: left"><strong>Number of Records</strong>: ' + d.records + '</p>';
                                });

                            _updateGraphAttrs();

                            if (!_svg) {
                                // SVG Object initialization...
                                _svg = d3.select('#world-map-overlay');

                                _groups.mapCanvas = _svg.append('g')
                                    .classed('map-canvas', true)
                                    .attr('transform', 'translate(' + 0 + ',' + 0 + ')');

                                _projection = d3.geo.eckert5()
                                    .scale(100 * _elDimensions.width/555)
                                    .translate([_elDimensions.width / 2, _elDimensions.height / 3])
                                    .precision(.2);

                                var path = d3.geo.path()
                                    .projection(_projection);

                                var graticule = d3.geo.graticule();


                                _svg.append('defs').append('path')
                                    .datum({type: 'Sphere'})
                                    .attr('id', 'sphere')
                                    .attr('d', path);

                              _groups.mapCanvas.append('use')
                                    .attr('class', 'stroke')
                                    .attr('xlink:href', '#sphere');

                              _groups.mapCanvas.append('use')
                                    .attr('class', 'fill')
                                    .attr('xlink:href', '#sphere');



                              /*_groups.mapCanvas.append('path')
                                  .datum(graticule)
                                  .attr('class', 'graticule')
                                  .attr('d', path);*/


                                d3.json('data/toronto-map/world-50m.json', function(error, world) {
                                    if (error) throw error;

                                  _groups.mapCanvas.insert('path', '.graticule')
                                        .datum(topojson.feature(world, world.objects.land))
                                        .attr('class', 'land')
                                        .attr('d', path);

                                  _groups.mapCanvas.insert('path', '.graticule')
                                        .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
                                        .attr('class', 'boundary')
                                        .attr('d', path);
                                });



                              _groups.mapCanvas.call(_tipFn);


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


                              var zoom = d3.behavior.zoom()
                                  .on('zoom',function() {
                                    var zoomScale =  Math.max(0.5, Math.min(8, d3.event.scale));

                                    _groups.mapCanvas
                                        .transition()
                                        .duration(10)
                                        .attr('transform','translate(' +
                                        d3.event.translate.join(',') +
                                        ") scale(" +
                                            zoomScale +
                                        ")");
console.log(zoomScale, d3.event.translate);
                                    _groups.mapCanvas.selectAll('path.graticule')
                                        .attr('d', path.projection(_projection));
                                  });

                              _svg.call(zoom);

                              $scope.resetZoomPan = function() {
                                zoom.scale(1);
                                zoom.translate([0, 0]);
                                _groups.mapCanvas.transition().attr('transform', 'translate(0,0) scale(1,1)');
                              };

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
