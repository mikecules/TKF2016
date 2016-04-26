(function() {
  // turn on JavaScript strictness so we can catch error's easier
  'use strict';

  angular.module('app')
    .controller('mainCtrl', ['$scope', function($scope) {

      var _ctrl = this,
          _mapData = {},
          _dataRelDir = 'data/toronto-map/',
          _dataSets = [
            {
              key: 'mapPoints',
              file: 'toronto-record-sets.csv'
            },
            {
              key: 'routePoints',
              file: 'toronto-poly-points.csv',
              transformationFn: function(d) {
                var pointIndexMap = {},
                    includeIDs = [464, 1];

                for (var i = 0; i < d.length; i++) {
                  var point = d[i],
                      index = +point.Index;

                  if (0 && includeIDs.indexOf(index) < 0) {
                    continue;
                  }

                  if (! angular.isDefined(pointIndexMap[point.Index])) {
                    pointIndexMap[index] = [];
                  }

                  pointIndexMap[index].push(point);

                }

                return pointIndexMap;

            }}
          ];

      var rsCount = 0;

      _dataSets.map(function(dataSet) {
        d3.csv(_dataRelDir + dataSet.file, function(data) {

          if (! angular.isArray(data) || data.length === 0) {
            throw new Error('Error retrieving dataset: ' + dataSet.file);
          }

          _mapData[dataSet.key] = angular.isFunction(dataSet.transformationFn) ? dataSet.transformationFn(data) : data;

          if (++rsCount === _dataSets.length) {
            $scope.$applyAsync(function() {
              _ctrl.mapData = _mapData;
              console.log($scope.mapData);
            });
          }

        });
      });

      setTimeout(function() {
        jQuery('.world-map-container > h1').addClass('intro-fade');
      },100);

  }]);
})();