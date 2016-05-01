(function() {
  'use strict';

  angular.module('app')
      .directive('barChart', function () {
        return {
          restrict: 'EA',
          scope: {
            data: '='
          },
          replace: true,
          templateUrl: 'partials/directives/bar-chart-directive.html'
        };
      });
})();
