(function() {
  // turn on JavaScript strictness so we can catch error's easier
  'use strict';

  angular.module('app')
      .controller('pongCtrl', function() {
        var _ctrl = this,
            _playerWinHistory = [];

        var winFn = function(p) {
          var player = {};

          angular.copy(p, player);

          _playerWinHistory.push(player);

          console.log(_playerWinHistory);
        };

        _ctrl.gameOverlay = {
          show: false,
          playerTarget: null,
          isPlayerTaunt: false,
          message: ''
        };

        _ctrl.playerWinHistory = _playerWinHistory;
        _ctrl.playCount = 50;

        _ctrl.players = [
          new VisPlayer('Duke')
              .on('playerWin', winFn),

          new VisPlayer('Arnold')
              .on('playerWin', winFn)
        ];


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
              ],
              _eventCallbacks = {
                playerWin: function() {},
                playerLose: function() {}
              },
              _characteristicsCopy = _characteristics.slice();


          function _updateCharacteristics(hasWon) {
            var incPropertyName = hasWon === true ? 'winInc' : 'loseInc';

            for (var i = 0; i < _characteristics.length; i++) {
              var attr = _characteristics[i];
              attr.value += attr[incPropertyName];
              attr.value = +parseFloat(Math.min(1, Math.max(0, attr.value))).toFixed(2);
            }

            _copyCharacteristics();

            _eventCallbacks['playerLose'].call(_visPlayer, _visPlayer);
          }

          function _copyCharacteristics() {
            _characteristicsCopy = _characteristics.slice();
          }

          _visPlayer.won = function() {

            _updateCharacteristics(true);

            _eventCallbacks['playerWin'].call(_visPlayer, _visPlayer);

            return _visPlayer;
          };

          _visPlayer.lost = function() {
            _updateCharacteristics(false);

            return _visPlayer;
          };

          _visPlayer.willTaunt = function() {
            var tauntProbability =  +parseFloat(Math.random()).toFixed(2);
            console.log(this.name() + ' taunt prob: ', tauntProbability, tauntProbability > (1 - _characteristics[CHARACTERISTICS.AGGRESSION].value));
            return tauntProbability >= (1 - _characteristics[CHARACTERISTICS.AGGRESSION].value);
          };

          _visPlayer.characteristics = function() {
            return _characteristicsCopy;
          };

          _visPlayer.beingTaunted = function() {
            var randomAffectedAttributeIndex = Math.round(Math.random() * 3) + 1; // Do not include Skill
            var positiveOrNegativeInfluenceProperty = (Math.random() > 0.5) ? 'winInc' : 'loseInc';

            var attr = _characteristics[randomAffectedAttributeIndex];
            console.log(attr, attr[positiveOrNegativeInfluenceProperty], positiveOrNegativeInfluenceProperty);

            attr.value += +parseFloat(attr[positiveOrNegativeInfluenceProperty]).toFixed(2);
            attr.value = Math.min(1, Math.max(0, attr.value));

            _copyCharacteristics();

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


          _visPlayer.on = function(eventName, fn) {
            if (typeof fn === 'function' && typeof _eventCallbacks[eventName] !== 'undefined') {
              _eventCallbacks[eventName] = fn;
            }

            return _visPlayer;
          };

        }
      });
})();