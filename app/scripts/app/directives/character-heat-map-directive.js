(function () {
  'use strict';

  angular.module('app')
      .directive('characterHeatMap', function () {
        return {
          restrict: 'EA',
          scope: {
            data: '=',
            playCount: '='
          },
          replace: true,
          templateUrl: 'partials/directives/character-heat-map-directive.html',
          link: function (scope, $element) {

            function Heatmap(domContainer, data, width, height, padding) {
              var _heatmap = this;


              _heatmap.OFFSET = 40;
              _heatmap._data = _heatmap.prepareData(data);
              _heatmap._width = width || ($element.width());
              _heatmap._height = height || ($element.parent().height());
              _heatmap._padding = padding || 0;
              _heatmap._lastX = {};

              _heatmap._containerSelection = d3.select(domContainer);
              _heatmap._svg = _heatmap._containerSelection.append('svg')
                  .classed('heatmap', true)
                  .attr('width', _heatmap._width)
                  .attr('height', _heatmap._height);

              // Create scale functions
              _heatmap._yScale = d3.scale.ordinal()
                  .domain(d3.range(_heatmap._data[0].length))
                  .rangeRoundBands([_heatmap.OFFSET, _heatmap._height -  _heatmap.OFFSET], 0.001);

              _heatmap._xScale = d3.scale.ordinal()
                  .domain(d3.range(scope.playCount))
                  .rangeRoundBands([0, _heatmap._width]);

              _heatmap._colourMap = [
                'rgb(31, 119, 180)',
                'rgb(44, 160, 44)',
                'rgb(214, 39, 40)',
                'rgb(148, 103, 189)',
                'rgb(140, 86, 75)'
              ];

            }

            Heatmap.prototype.render = function () {
              var _heatmap = this;

              var groups = _heatmap._svg.selectAll('g.player-history-col')
                  .data(_heatmap._data);

              groups.enter().append('g')
                  .classed('player-history-col', true);

              var circles = groups.selectAll('circle.bubble')
                  .data(function (d) {
                    return d;
                  });


              var radiusFn = function(d) { return  d.value * _heatmap._yScale.rangeBand() / 3; };

              circles.enter()
                  .append('circle')
                  .attr('class', function(d) { return d.playerName.toLowerCase() + ' bubble'; })
                  .style({'opacity': 0})
                  .attr({
                    'r': 0,
                    'cx': 0,
                    'cy': function(d) { return d.rowIndex * _heatmap._yScale.rangeBand() + _heatmap.OFFSET; }
                    })
                  .transition()
                  .delay(function (d, i) {
                    return i / _heatmap._data.length * 500;
                  })
                  .attr('cx', function(d) {

                    if (! angular.isDefined(_heatmap._lastX[d.colIndex])) {
                      _heatmap._lastX[d.colIndex] = {};
                    }

                    if (! angular.isDefined(_heatmap._lastX[d.colIndex][d.rowIndex])) {

                      if (d.colIndex === 0) {
                        _heatmap._lastX[d.colIndex][d.rowIndex] = 0;
                      }
                      else {
                        _heatmap._lastX[d.colIndex][d.rowIndex] = _heatmap._lastX[d.colIndex - 1][d.rowIndex];
                      }
                    }

                    var x = _heatmap._lastX[d.colIndex][d.rowIndex] + 4;

                    _heatmap._lastX[d.colIndex][d.rowIndex] +=  radiusFn(d) * 2;


                    return  x;//_heatmap._lastX[d.colIndex][d.rowIndex];
                  })
                  .attr('cy', function(d) { return d.rowIndex * _heatmap._yScale.rangeBand() + _heatmap.OFFSET; })
                  .attr('r', function(d) {  return radiusFn(d); })
                  .style({
                    'fill': function (d, i) {
                      return _heatmap._colourMap[i];
                    },
                    'opacity': function(d) {
                      return d.value;
                    }
                  });

              if (! circles.empty()) {

                d3.timer(function() {
                  _heatmap._tick(circles, +parseFloat(_heatmap._yScale.rangeBand() * 0.1).toFixed(2));
                });
              }


              circles.exit().remove();
              groups.exit().remove();

              return _heatmap;

            };

            Heatmap.prototype._tick = function(circles, amplitude) {

              var t = +(new Date());

              circles.attr('transform', function(d) {
                    return 'translate(' + [ d.value * amplitude, Math.sin(t * d.value / 1000) * amplitude] + ')';
                  });

            };

            Heatmap.prototype.data = function (data) {
              var _heatmap = this;

              if (arguments.length === 1 && angular.isArray(data)) {
                _heatmap._data = _heatmap.prepareData(data);
              }

              return _heatmap._data;
            };


            Heatmap.prototype.prepareData = function(playerHistory) {
              var d = [];

              for (var i = 0; i < playerHistory.length; i++) {
                var playerName =  playerHistory[i].name(),
                    playCharacteristics = playerHistory[i].characteristics();

                var attr = [],
                    j = 0;

                for (var characteristic in playCharacteristics) {

                  if (! playCharacteristics.hasOwnProperty(characteristic)) {
                    continue;
                  }

                  var attribute = playCharacteristics[characteristic];

                  attr.push({
                    playerName: playerName,
                    attr: attribute.attr,
                    value: attribute.value,
                    rowIndex: j++,
                    colIndex: i
                  });

                }

                d.push(attr);
              }


              console.log(d);

              return d;
            };


            function _init(el) {





              scope.$watch(function () {
                return scope.data;
              }, function (data) {

                if (! angular.isArray(data) || data.length === 0) {
                  return;
                }

                if (! _heatmap) {
                  _heatmap = new Heatmap(el, data);
                }
                else {
                  _heatmap.data(data);
                }

                _heatmap.render();
              }, true);

            }


            var _heatmap = null;


            $element.parent().height($(window).height() - $element.parent().offset().top - 30);

            _init($element[0]);


          }
        };
      });
})();
