(function () {
  'use strict';

  angular.module('app')
      .directive('characterStatsBarChart', function () {
        return {
          restrict: 'EA',
          scope: {
            data: '='
          },
          replace: true,
          templateUrl: 'partials/directives/character-stats-bar-chart-directive.html',
          link: function (scope, $element) {

            function Barchart(domContainer, data, width, height, padding) {
              var _barchart = this;
              _barchart._data = data || [];
              _barchart._width = width || ($element.width());
              _barchart._height = height || ($element.height() - 80);
              _barchart._padding = padding || 0;

              _barchart._containerSelection = d3.select(domContainer);
              _barchart._svg = _barchart._containerSelection.insert('svg', ':first-child')
                  .classed('barchart', true)
                  .attr('width', _barchart._width)
                  .attr('height', _barchart._height);

              _barchart._svg.append('defs')
                  .append('clipPath')
                  .attr('clipPathUnits', 'userSpaceOnUse')
                  .attr('id', 'chartArea')
                  .append('rect')
                  .attr('fill', 'none')
                  .attr('x', _barchart._padding / 2)
                  .attr('y', _barchart._padding - 5)
                  .attr('width', _barchart._width)
                  .attr('height', _barchart._height - _barchart._padding);

              // Create scale functions
              _barchart._yScale = d3.scale.linear()
                  .domain([1, 0])
                  .range([20, _barchart._height - _barchart._padding]);

              _barchart._xScale = d3.scale.ordinal()
                  .domain(d3.range(_barchart._data.length))
                  .rangeRoundBands([40, _barchart._width - 30], 0.1);


              // Define Y axis
              _barchart._yAxis = d3.svg.axis()
                  .scale(_barchart._yScale)
                  .orient('left')
                  .ticks(5);

              // Create Y axis
              _barchart._svg.append('g')
                  .attr('class', 'axis')
                  .attr('transform', 'translate(40, -5)')
                  .call(_barchart._yAxis);

              _barchart._g = _barchart._svg.append('g')
                  .attr('clip-path', 'url(#chartArea)')
                  .attr('id', 'chart');

              _barchart._colourMap = [
                'rgb(31, 119, 180)',
                'rgb(44, 160, 44)',
                'rgb(214, 39, 40)',
                'rgb(148, 103, 189)',
                'rgb(140, 86, 75)'
              ];


            }

            Barchart.prototype.render = function () {
              var _barchart = this;

              var groups = _barchart._g.selectAll('g.bar')
                  .data(_barchart._data);

              groups.enter().append('g')
                  .classed('bar', true)
                  .attr('transform', function (d, i) {
                    d._index = i;
                    return 'translate(' + _barchart._xScale(i) /* move away from y-axis labels */
                        + ', ' + (_barchart._height + _barchart._padding) + ')';
                  });

              var bars = groups.selectAll('rect.bar')
                  .data(function (d) {
                    return [d];
                  });

              bars.enter()
                  .append('rect')
                  .classed('bar', true)
                  .attr('x', 0)
                  .attr('y', 0)
                  .attr('width', _barchart._xScale.rangeBand())
                  .style('fill', function (d) {
                    return _barchart._colourMap[d._index];
                  });

              bars.style('fill', function (d) {
                    return  d3.rgb(_barchart._colourMap[d._index]).darker(2.5);
                  })
                  .transition()
                  .delay(500)
                  .style('fill', function (d) {
                    return _barchart._colourMap[d._index];
                  })
                  .attr('height', function (d) {
                return _barchart._yScale(d.value);
              });


              groups.transition()
                  .delay(function (d, i) {
                    return i / _barchart._data.length * 1000;
                  })
                  .attr('transform', function (d, i) {
                    return 'translate(' + _barchart._xScale(i) + ', ' + (_barchart._height - _barchart._yScale(d.value) + 10) + ')';
                  });

              var labels = groups.selectAll('text')
                  .data(function (d) {
                    return [d]
                  });

              labels.enter().append('text')
                  .attr('y', 15)
                  .attr('fill', '#ffffff');

              labels.text(function (d) {
                return parseFloat(d.value).toFixed(2);
              })
              .attr('x', function() { return (_barchart._xScale.rangeBand() - this.getComputedTextLength()) / 2; })

              bars.exit().remove();
              labels.exit().remove();
              groups.exit().remove();

              return _barchart;

            };

            Barchart.prototype.data = function (data) {
              var _barchart = this;

              if (arguments.length === 1 && angular.isArray(data)) {
                _barchart._data = data;
                _barchart._yScale.domain([0, 1]);
              }

              return _barchart._data;
            };


            function _init(el) {


              _barChart = new Barchart(el, scope.data).render();


              scope.$watch(function () {
                return scope.data;
              }, function (data) {

                if (!angular.isArray(data)) {
                  return;
                }

                _barChart.data(data);
                _barChart.render();
              });

            }


            var _barChart = null;

            _init($element[0]);

          }
        };
      });
})();
