(function() {
  // turn on JavaScript strictness so we can catch error's easier
  'use strict';

  angular.module('app')
      .controller('pongCtrl', ['$rootScope', function($rootScope) {
        var _ctrl = this,
            _playerWinHistory = [];

        $rootScope.route = {
          pong: true
        };

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

        _ctrl.isSoundOn = true;

        _ctrl.playerWinHistory = _playerWinHistory;
        _ctrl.playCount = 50;

        _ctrl.players = [
          new VisPlayer('Duke')
              .on('playerWin', winFn)
              .setTaunts(
                  [
                    'audio/arnold/daddy.mp3',
                    'audio/arnold/deep.mp3',
                    'audio/arnold/surprise.mp3',
                    'audio/arnold/knowu.mp3'
                  ]),

          new VisPlayer('Arnold')
              .on('playerWin', winFn)
              .setTaunts(
                  [
                    'audio/duke/equal-opportunity.mp3',
                    'audio/duke/pissed-off.mp3',
                    'audio/duke/wasting-time.mp3',
                    'audio/duke/wasted.mp3'
                  ])
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
                {attr: 'Skill', value: 0.1, winInc: 0.05, loseInc: 0.02},
                {attr: 'Energy', value: 0.5, winInc: 0.05, loseInc: -0.01},
                {attr: 'Confidence', value: 0.5, winInc: 0.1, loseInc: -0.05},
                {attr: 'Aggression', value: 0.5, winInc: -0.1, loseInc: 0.1},
                {attr: 'Luck', value: 0.5, winInc: -0.05, loseInc: 0.05}
              ],
              _eventCallbacks = {
                playerWin: function() {
                },
                playerLose: function() {
                }
              },
              _tauntsAudioList = [],
              _audioResourceHandles = {},
              _lastTauntChosenIndex = null,
              _characteristicsCopy;

          function _init() {
            _randomizeCharacteristics();
            _copyCharacteristics();
          }

          function _randomizeCharacteristics() {
            var maxVal = 0.30,
                minVal = maxVal / 2;

            for (var i = 0; i < _characteristics.length; i++) {
              var attr = _characteristics[i];
              attr.value = Math.random() * maxVal;
              attr.value = +parseFloat(Math.max(minVal, attr.value)).toFixed(2);
            }

            console.log(_characteristics);

          }

          function _doesCharacteristicHaveEffect(characteristicIndex) {
            var characteristic = _characteristics[characteristicIndex];
            var randomChance = Math.random();
            var hasEffect = randomChance >= 1 - characteristic.value;
            //console.log(randomChance, 1 - (characteristic.successWeight * characteristic.value), hasEffect);
            return hasEffect;
          }

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
            // based on pure aggression (make random)
            var isGonnaTaunt = _doesCharacteristicHaveEffect(CHARACTERISTICS.AGGRESSION);
            console.log(this.name() + ' TAUNTED PLAYER: ', isGonnaTaunt);
            return isGonnaTaunt;
          };

          _visPlayer.setTaunts = function(taunts) {
            if (angular.isArray(taunts)) {
              _tauntsAudioList = taunts;
            }

            return _visPlayer;
          };

          _visPlayer.taunted = function() {

            if (_tauntsAudioList.length === 0) {
              return;
            }

            var tauntIndex = Math.round(Math.random() * (_tauntsAudioList.length - 1));

            while (_tauntsAudioList.length > 1 && tauntIndex === _lastTauntChosenIndex) {
              tauntIndex = Math.round(Math.random() * (_tauntsAudioList.length - 1));
            }

            _lastTauntChosenIndex = tauntIndex;

            var audioFile = _tauntsAudioList[tauntIndex];

            if (! angular.isDefined(_audioResourceHandles[audioFile])) {
              _audioResourceHandles[audioFile] = new Audio(audioFile);
            }

            _audioResourceHandles[audioFile].play();
          };

          _visPlayer.characteristics = function() {
            return _characteristicsCopy;
          };

          _visPlayer.beingTaunted = function() {
            var randomAffectedAttributeIndex = Math.round(Math.random() * 3) + 1; // Do not include Skill

            // positive based on confidence/skill - aggression OR lucky!
            var positiveInfluenceEffect = _doesCharacteristicHaveEffect(CHARACTERISTICS.SKILL) ||
                _doesCharacteristicHaveEffect(CHARACTERISTICS.CONFIDENCE);

            var positivelyEffected = positiveInfluenceEffect && !_doesCharacteristicHaveEffect(CHARACTERISTICS.AGGRESSION) ||
                _doesCharacteristicHaveEffect(CHARACTERISTICS.LUCK);

            var positiveOrNegativeInfluenceProperty = positivelyEffected ? 'winInc' : 'loseInc';

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

          _visPlayer.isLuckyDay = function() {
            // Luckyness does not have a weight it's completely random
            var isLuckyDay = _doesCharacteristicHaveEffect(CHARACTERISTICS.LUCK);
            console.log(this.name() + '\'s Lucky Day: ', isLuckyDay);

            if (isLuckyDay) {
              _characteristics[CHARACTERISTICS.ENERGY].value += 0.05;
              _characteristics[CHARACTERISTICS.ENERGY].value = Math.min(1, _characteristics[CHARACTERISTICS.ENERGY].value);
              _copyCharacteristics();
            }

            return isLuckyDay;
          };

          _visPlayer.getPlayerSpeed = function(ballVelocityPercentages) {
            // speed = aggression + energy
            var speed = 1.0,
                speedInc = 0.2;

            var highestBallVelocity = Math.max(ballVelocityPercentages.x, ballVelocityPercentages.y);

            // we don't want to speed up here
            if (highestBallVelocity === 1) {
              return speed;
            }

            if (_doesCharacteristicHaveEffect(CHARACTERISTICS.AGGRESSION)) {
              speed += speedInc;
              // Aggression Penalty
              _characteristics[CHARACTERISTICS.ENERGY].value -= 0.05;
              _characteristics[CHARACTERISTICS.ENERGY].value = Math.max(0, _characteristics[CHARACTERISTICS.ENERGY].value);
            }

            if (_doesCharacteristicHaveEffect(CHARACTERISTICS.ENERGY)) {
              // Bonus for using energy
              speed += speedInc + 0.1;

              // Regular Speed usage penalty if skill does not prevent it
              if (!_doesCharacteristicHaveEffect(CHARACTERISTICS.SKILL)) {
                _characteristics[CHARACTERISTICS.ENERGY].value -= 0.02;
                _characteristics[CHARACTERISTICS.ENERGY].value = Math.max(0, _characteristics[CHARACTERISTICS.ENERGY].value);
              }
            }

            if (_doesCharacteristicHaveEffect(CHARACTERISTICS.LUCK)) {
              speed += speedInc / 2;
            }

            if (speed > 1) {
              _copyCharacteristics();
            }

            console.log(this.name() + ' VELOCITY: ', speed);
            return speed;

          };

          _init();
        }
      }]);
})();