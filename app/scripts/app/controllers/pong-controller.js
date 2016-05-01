(function() {
  // turn on JavaScript strictness so we can catch error's easier
  'use strict';

  angular.module('app')
      .controller('pongCtrl', function() {
        var _ctrl = this;
        _ctrl.players = {arnold : {score: 0}, duke: {score: 0}};
      });
})();