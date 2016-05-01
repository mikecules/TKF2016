(function() {
  // turn on JavaScript strictness so we can catch error's easier
  'use strict';

  angular.module('app')
      .controller('pongCtrl', function() {
        var _ctrl = this;

        _ctrl.gameOverlay = {
          show: false,
          playerTarget: null,
          message: ''
        };

        _ctrl.players = [new VisPlayer('Duke'), new VisPlayer('Arnold')];
      });

      function VisPlayer(name) {

        var CHARACTERISTICS = {
          SKILL: 0,
          ENERGY: 1,
          CONFIDENCE: 2,
          AGGRESSION: 3,
          LUCK: 4
        };

        var _visPlayer = this,
            _name = name || 'Player',
            _score = 0,
            _characteristics = [
              {attr: 'Skill', value: 0.1, successWeight: 0.2, winInc: 0.05, loseInc: 0.02},
              {attr: 'Energy', value: 0.5, successWeight: 0.2, winInc: 0.02, loseInc: 0.01},
              {attr: 'Confidence', value: 0.5, successWeight: 0.2, winInc: 0.1, loseInc: -0.05},
              {attr: 'Aggression', value: 0.5, successWeight: 0.2, winInc: 0, loseInc: 0.1},
              {attr: 'Luck', value: 0.5, successWeight: 0.2, winInc: -0.05, loseInc: 0.05}
            ];


        function _updateCharacteristics(hasWon) {
          var incPropertyName = hasWon === true ? 'winInc' : 'loseInc';

          for (var i = 0; i < _characteristics.length; i++) {
            var attr = _characteristics[i];
            attr.value += attr[incPropertyName];
            attr.value = Math.min(1, Math.max(0, attr.value));
          }
        }

        _visPlayer.won = function() {
          _updateCharacteristics(true);

          return _visPlayer;
        };

        _visPlayer.lost = function() {
          _updateCharacteristics(false);

          return _visPlayer;
        };

        _visPlayer.willTaunt = function() {
          return (_characteristics[CHARACTERISTICS.AGGRESSION] * Math.random()) > 0.5;
        };

        _visPlayer.characteristics = function() {
          var characteristicsCopy = {};

          angular.copy(_characteristics,characteristicsCopy);

          return characteristicsCopy;
        };

        _visPlayer.beingTaunted = function() {
          var randomAffectedAttributeIndex = Math.round(Math.random() * 4) + 1; // Do not include Skill
          var positiveOrNegativeInfluenceProperty = Math.random() > 0.5 ? 'winInc' : 'loseInc';

          var attr = _characteristics[randomAffectedAttributeIndex];

          attr.value += parseFloat(attr[positiveOrNegativeInfluenceProperty]).toFixed(2);
          attr.value = Math.min(1, Math.max(0, attr.value));

          return _visPlayer;
        };

        _visPlayer.name = function(name) {

          if (typeof score === 'string') {
            _name = name;
          }

          return _name;
        };

        _visPlayer.score = function(score) {

          if (typeof score === 'number') {
            _score = score;
          }

          return _score;
        };

      }
})();