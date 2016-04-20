(function() {
	'use strict';

  angular.module('app', ['ngRoute'])
      .constant('appConstants', {})
      .config(function ($routeProvider, $compileProvider) {

        $routeProvider.when('/', {
              templateUrl: 'partials/views/main.html',
              controller: 'mainCtrl',
              controllerAs: 'mainCtrl'
            })
            .when('/pong', {
              templateUrl: 'partials/views/pong.html',
              controller: 'pongCtrl',
              controllerAs: 'pongCtrl'
            })
            .otherwise({
              redirectTo: '/'
            });

        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|javascript):/);
      });
})();