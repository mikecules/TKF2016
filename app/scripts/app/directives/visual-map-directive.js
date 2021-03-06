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
              templateUrl: 'partials/directives/world-map-directive.html',
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
                    _line = null,
                    _projection = null,
                    _groups = {
                      mapCanvas: null,
                      coordsCanvas: null,
                      pathCanvas: null
                    },
                    _tips = null,
                    _lastTransformation = {
                      translate: null,
                      scale: null
                    };

                /* Constants */
                var SVG_MAP_ASPECT_RATIO = 1 / 1.33,
                    MAP = {'high-res': 'world-50m.json', 'low-res': 'world-110m.json'};

                function _mapDrawnCallback(error, world) {
                  if (error) throw error;

                  _svg.attr('viewBox', '0 0 ' + _elDimensions.width + ' ' + _elDimensions.height);

                  var graticule = d3.geo.graticule();
                  var path = d3.geo.path()
                      .projection(_projection);
                  var isFirefox = typeof window.InstallTrigger !== 'undefined';

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



                  _groups.mapCanvas
                      .classed('on-gpu', ! isFirefox)
                      .insert('path', '.graticule')
                      .datum(topojson.feature(world, world.objects.land))
                      .attr('class', 'land')
                      .attr('d', path);

                  _groups.mapCanvas.insert('path', '.graticule')
                      .datum(topojson.mesh(world, world.objects.countries, function(a, b) {
                        return a !== b;
                      }))
                      .attr('class', 'boundary')
                      .attr('d', path);

                  if (!_groups.coordsCanvas) {
                    _groups.coordsCanvas = _groups.mapCanvas.append('g')
                        .classed('map-coords', true)
                        .call(_tipFn);
                  }




                  var zoom = d3.behavior.zoom()
                      .on('zoom', function() {

                        var zoomScale = Math.max(0.5, Math.min(8, d3.event.scale)),
                            translate = d3.event.translate;

                        _tipFn.attr('class', 'd3-tip').hide();

                        if (! isFirefox) {
                          _groups.mapCanvas
                              .style('transform', 'translate3d(' +
                                  translate[0] + 'px,' + translate[1] + 'px'
                                  + ', 0px) ' + ' scale3d(' + zoomScale + ',' + zoomScale + ', 1)');
                        }
                        else {
                          _groups.mapCanvas
                              .attr('transform', 'translate(' +
                                  translate[0] + ',' + translate[1] + ''
                                  + ') ' + ' scale(' + zoomScale + ',' + zoomScale + ')');
                        }

                        if (_tips && ! _tips.hasClass('hidden')) {
                          _tips.addClass('hidden');
                        }

                        _lastTransformation.translate = translate;
                        _lastTransformation.scale = zoomScale;

                      });

                  _svg.call(zoom);


                  $scope.resetZoomPan = function() {
                    _tipFn.attr('class', 'd3-tip').hide();
                    zoom.scale(1);
                    zoom.translate([0, 0]);

                    if (! isFirefox) {
                      _groups.mapCanvas.style('transform', 'translate3d(0, 0, 0) ' +
                          ' scale3d(1, 1, 1)');
                    }
                    else {
                      _groups.mapCanvas.attr('transform', 'translate(0, 0) ' +
                          ' scale(1, 1)');
                    }

                  };

                  if (angular.isArray(_lastTransformation.translate)) {

                    if (! isFirefox) {
                    _groups.mapCanvas
                        .style('transform', 'translate3d(' +
                            _lastTransformation.translate[0] + 'px,' + _lastTransformation.translate[1] + 'px'
                            + ', 0px) ' + ' scale3d(' + _lastTransformation.scale +
                            ',' + _lastTransformation.scale + ', 1)');
                    }
                    else {

                      _groups.mapCanvas
                        .attr('transform', 'translate(' +
                          _lastTransformation.translate[0] + ',' + _lastTransformation.translate[1] +
                          ') ' + ' scale(' + _lastTransformation.scale +
                          ',' + _lastTransformation.scale + ')');
                    }

                    zoom.scale(_lastTransformation.scale);
                    zoom.translate([_lastTransformation.translate[0], _lastTransformation.translate[1]]);
                  }

                  if (_mapData) {
                    _ctrl.render();
                  }
                }

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

                  if (!_tips) {
                    _tips = jQuery('.tip');
                  }

                  if (_tips.is(':visible')) {
                    _tips.css({
                      'left': Math.round($(window).width() / 2 - _tips.outerWidth() / 2) + 'px',
                      'top': Math.round($(window).height() / 4 - _tips.outerHeight() / 2) + 'px'
                    });

                  }

                  //console.log(_elDimensions);
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

                  if (!_mapData || !_groups.coordsCanvas) {
                    return;
                  }

                  if (!_groups.pathCanvas) {
                    _groups.pathCanvas = _groups.mapCanvas.insert('g', 'g.map-coords').classed('route-path', true);

                    for (var index in _mapData.routePoints) {
                      if (!_mapData.routePoints.hasOwnProperty(index)) {
                        continue;
                      }

                      var data = _mapData.routePoints[index];

                      _groups.pathCanvas
                          .append('path')
                          .classed('route-' + index, true)
                          .attr('d', _line(data))
                          .attr('stroke', '#008BB0')
                          .attr({'stroke-width': '0.5px', 'fill': 'none'});

                    }

                  }

                  // Draw points
                  var cityPoints = _groups.coordsCanvas.selectAll('circle.data-point')
                      .data(_mapData.mapPoints);

                  cityPoints.enter().append('circle')
                      .classed('data-point', true)
                      .classed('callout-point', function(d) {
                        return +d.Index === 464;
                      })
                      .on('mouseover', function(d) {
                        d3.select(this).interrupt().transition().attr('r', 5);
                        _tipFn.attr('class', 'd3-tip animate').show(d);
                      })
                      .on('mouseout', function(d) {
                        d3.select(this).interrupt().transition().attr('r', 2);
                        _tipFn.attr('class', 'd3-tip').hide(d);
                      });

                  cityPoints
                      .attr('cx', function(d) {
                        //console.log('Long:', d.Long);
                        return _projection([d.Long, d.Lat])[0];
                      })
                      .attr('cy', function(d) {
                        //console.log('Lat: ', d.Lat);
                        return _projection([d.Long, d.Lat])[1];
                      })
                      .attr('r', 0)
                      .transition()
                      .attr('r', function(d) {
                        return +d.Index === 464 ? 4 : 2;
                      });

                  cityPoints.exit().remove();

                };

                _ctrl.init = function($element) {

                  _$element = $element;

                  _groups = {
                    mapCanvas: null,
                    coordsCanvas: null,
                    pathCanvas: null
                  }

                  //Mouseover tip
                  _tipFn = d3.tip()
                      .direction('n')
                      .attr('class', 'd3-tip animate')
                      .offset([-15, 0])
                      .html(function(d) {

                        if (!angular.isDefined(d)) {
                          return '';
                        }

                        return '<strong>' + d.Institution + '</strong> <hr />' +
                            '<p style="text-align: left"><strong>Latitude</strong>: ' + d.Lat + '<br />' +
                            '<strong>Longitude</strong>: ' + d.Long + '</p>' +
                            '<p style="text-align: left"><strong>Number of Records</strong>: ' + d.records + '</p>';
                      });

                  _updateGraphAttrs();

                  if (!_svg) {
                    // SVG Object initialization...
                    _svg = d3.select('#world-map-overlay');

                    _projection = d3.geo.eckert5()
                        .scale(100 * _elDimensions.width / 555)
                        .translate([_elDimensions.width / 2, _elDimensions.height / 3])
                        .precision(.5);

                    _line = d3.svg.line()
                        .x(function(d) {
                          return _projection([d.Long, d.Lat])[0];
                        })
                        .y(function(d) {
                          return _projection([d.Long, d.Lat])[1];
                        })
                        .interpolate('basis');

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

                    $scope.$on('$destroy', function() {
                      var removeEvent = $window.detachEvent ?
                          function(f) {
                            $window.detachEvent('onresize', f);
                          } :
                          function(f) {
                            $window.removeEventListener('resize', f);
                          };

                      removeEvent(debouncedUpdate);
                    });

                  }

                  _groups.mapCanvas = _svg.append('g')
                      .classed('map-canvas', true);
                  d3.json('data/toronto-map/' + MAP[$scope.currentMapResolution], _mapDrawnCallback);

                };

              }],
              link: function(scope, element, attrs, mapCtrl) {

                scope.currentMapResolution = 'low-res';

                // Assume salesData is either a function that returns the data or is the data itself...
                var mapDataFn = angular.isFunction(scope.mapData) ?
                    scope.mapData : function() {
                  return scope.mapData;
                };

                mapCtrl.init(element);

                scope.setCurrentMapResolution = function(res) {
                  scope.currentMapResolution = res;

                  element.find('svg').empty();
                  mapCtrl.init(element);
                  mapCtrl.render();
                };

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
