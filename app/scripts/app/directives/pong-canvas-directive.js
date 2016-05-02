(function() {
  'use strict';

  angular.module('app')
      .directive('pongCanvas', function(webGLDrawUtilities, $timeout) {
            return {
              restrict: 'EA',
              scope: true,
              replace: true,
              templateUrl: 'partials/directives/pong-canvas-directive.html',
              controller: function() {

                var _ctrl = this,
                    $element = null;


                _ctrl.init = function(el) {
                  $element = el;
                };

                _ctrl.CanvasWidget = CanvasWidget;

                // Canvas() constructor method represents the DOM canvas and provides methods
                // for creating 2d and WebGL canvases. Also in the case of WebGL canvases the
                // below constructor offers methods for creating the webGL program and compiling and linking
                // or vertex and fragment shaders.
                function Canvas(id, type) {

                  var __canvas = this,
                      __context = null,
                      __canvasEl = null,
                      __canvasJQObj = null,
                      __canvasID = id,
                      __canvasType = ((type === Canvas.prototype.CANVAS_TYPES.CANVAS_3D) ? Canvas.prototype.CANVAS_TYPES.CANVAS_3D : Canvas.prototype.CANVAS_TYPES.CANVAS_2D),
                      __height = $element.height(),
                      __width = $element.width(),
                      __viewportAspectRatio = 0.0,
                      __viewportNeedsUpdate = true,
                      __glProgram = null,
                      __shaders = {};


                  // __initProgram() create our program and link our shaders
                  function __initProgram() {
                    if (__context === null || __canvasType !== Canvas.prototype.CANVAS_TYPES.CANVAS_3D) {
                      return;
                    }

                    // create a program.
                    __glProgram = __context.createProgram();

                    // attach the shaders.
                    var  vertexShaderResource = __shaders[Canvas.prototype.SHADER_TYPES.VERTEX].resource,
                        fragmentShaderResource = __shaders[Canvas.prototype.SHADER_TYPES.FRAGMENT].resource;

                    if (vertexShaderResource) {
                      __context.attachShader(__glProgram, vertexShaderResource);
                    }

                    if (fragmentShaderResource) {
                      __context.attachShader(__glProgram, fragmentShaderResource);
                    }


                    // link the program.
                    __context.linkProgram(__glProgram);

                    // Check if it linked.
                    var success = __context.getProgramParameter(__glProgram, __context.LINK_STATUS);

                    if (! success) {
                      // something went wrong with the link
                      throw new Error('Program filed to link: ' + __context.getProgramInfoLog(__glProgram));
                    }

                    // tell the webGl context to use this program
                    // note that you can switch between multiple programs within the lifecycle
                    // of your own apps
                    __context.useProgram(__glProgram);

                    return __glProgram;
                  }

                  // __getShaderContentsHelper() grabs the text of shader in the DOM if we pass in the JQuery ID str
                  // i.e. the id is prefixed with '#'
                  function __getShaderContentsHelper(shaderStr) {
                    var shaderContents = null;


                    if (shaderStr[0] === '#') {
                      var idDOM = $(shaderStr);

                      if (idDOM.length) {
                        shaderContents = idDOM.text();
                      }
                    }

                    return shaderContents;
                  }


                  // __setShaders() compiles our shaders and initalizes the program
                  function __setShaders(vertexShaderStr, fragmentShaderStr) {

                    if (! __context || typeof vertexShaderStr !== 'string' || typeof fragmentShaderStr !== 'string' || __canvasType !== Canvas.prototype.CANVAS_TYPES.CANVAS_3D) {

                      throw new Error('Could not set the vertex/fragment shaders!\nYou sent vertex shader contents: ' +
                          vertexShaderStr + '\nYou sent fragment shader contents: ' + fragmentShaderStr);
                    }

                    var vsContents = __getShaderContentsHelper(vertexShaderStr),
                        fsContents = __getShaderContentsHelper(fragmentShaderStr);


                    var compiledVertexShader = __compileShader(vsContents, __context.VERTEX_SHADER),
                        compiledFragmentShader = __compileShader(fsContents, __context.FRAGMENT_SHADER);


                    var vs = __shaders[Canvas.prototype.SHADER_TYPES.VERTEX],
                        fs = __shaders[Canvas.prototype.SHADER_TYPES.FRAGMENT];

                    vs.src = vsContents, vs.resource = compiledVertexShader;
                    fs.src = fsContents, fs.resource = compiledFragmentShader;

                    return __initProgram();
                  }

                  // __compileShader() does exactly what it says it does accept that it will complain if something goes
                  // wrong with the compilation
                  function __compileShader(shaderSource, shaderType) {

                    if (__context === null || __canvasType !== Canvas.prototype.CANVAS_TYPES.CANVAS_3D || typeof shaderSource !== 'string') {
                      return null;
                    }


                    // Create the shader object
                    var shader = __context.createShader(shaderType);

                    // Set the shader source code.
                    __context.shaderSource(shader, shaderSource);

                    // Compile the shader
                    __context.compileShader(shader);

                    // Check if it compiled
                    var success = __context.getShaderParameter(shader, __context.COMPILE_STATUS);

                    if (! success ) {
                      // Something went wrong during compilation; get the error
                      throw new Error('Could not compile ' + (shaderType === __context.VERTEX_SHADER ? 'vertex' : 'fragment') +  ' shader: ' + __context.getShaderInfoLog(shader));
                    }

                    return shader;
                  }

                  // __initCanvas() initializes the canvas object
                  function __initCanvas() {
                    __canvasJQObj = $('<canvas id="' + __canvasID +  '"></canvas>');

                    if (! __canvasJQObj.length) {
                      throw new Error('Unable to create canvas with ID "' + __canvasID + '"!');
                    }

                    __canvasEl = __canvasJQObj[0];

                    __setHeight(__height);
                    __setWidth(__width);

                    __initContext();
                    __updateViewportSize();


                    __shaders[Canvas.prototype.SHADER_TYPES.VERTEX] = {src: '', resource: null};
                    __shaders[Canvas.prototype.SHADER_TYPES.FRAGMENT] = {src: '', resource: null};

                  }

                  function __getVShadersObj() {
                    return __shaders;
                  }

                  //__initContext() creates our canvas context based on the type of canvas it is i.e. 2d/webgl
                  function __initContext() {

                    __context = null;

                    switch(__canvasType) {

                      case Canvas.prototype.CANVAS_TYPES.CANVAS_3D:
                        try {
                          // Try to grab the standard context. If it fails, fallback to experimental.
                          __context = __canvasEl.getContext(__canvasType) || __canvasEl.getContext('experimental-webgl');
                        }
                        catch(e) {
                          throw new Error(e);
                        }
                        break;

                      default:
                        try {
                          // Try to grab the standard context. If it fails, fallback to experimental.
                          __context = __canvasEl.getContext(__canvasType);
                        }
                        catch(e) {
                          throw new Error(e);
                        }
                        break;

                    }

                    // If we don't have a context, give up now
                    if (! __context) {
                      throw new Error('Unable to initialize canvas context. Your browser may not support it.');
                      __context = null;
                    }

                    //console.log('Canvas Context: ', __context);
                  }

                  function __setHeight(h) {
                    __height = h;
                    __viewportNeedsUpdate = true;
                    __canvasJQObj.attr('height', h);
                  }

                  function __setWidth(w) {
                    __width = w;
                    __viewportNeedsUpdate = true;
                    __canvasJQObj.attr('width', w);
                  }

                  function __updateViewportSize() {
                    if (__canvasType === Canvas.prototype.CANVAS_TYPES.CANVAS_3D && __context && __viewportNeedsUpdate) {
                      __context.viewport(0, 0, __width, __height);
                      __viewportAspectRatio = __width / __height;
                      __viewportNeedsUpdate = false;
                    }
                  }

                  // run initializer for the object
                  __initCanvas(id);

                  // public accessors for Canvas
                  __canvas.getCanvasEl = function() {
                    return __canvasEl;
                  };

                  __canvas.getCanvasJQObj = function() {
                    return __canvasJQObj;
                  };

                  __canvas.getContext = function() {
                    return __context;
                  };

                  __canvas.getViewportAspectRatio = function() {
                    return __viewportAspectRatio;
                  };

                  __canvas.getWidth = function() {
                    return __width;
                  };

                  __canvas.getHeight = function() {
                    return __height;
                  };

                  __canvas.getGLProgram = function() {
                    return __glProgram;
                  };


                  __canvas.setVertexAndFragmentShaders = __setShaders;
                  __canvas.getShaders = __getVShadersObj;

                  __canvas.updateViewportSize = __updateViewportSize;

                  // destroys the canvas's inner objects so it can be garbage collected in the future
                  __canvas.destroy = function() {
                    if (__canvasJQObj !== null && __canvasJQObj.length) {
                      __canvasJQObj.remove();

                      __canvasJQObj = null;
                      __canvasEl = null;
                      __shaders = null;
                      __glProgram = null;
                      __context = null;
                    }
                  };

                }

                // Set the canvas prototype with shared code
                Canvas.prototype = {
                  CANVAS_TYPES: {
                    CANVAS_2D: '2d',
                    CANVAS_3D: 'webgl'
                  },
                  SHADER_TYPES: {
                    VERTEX: 'vertex',
                    FRAGMENT: 'fragment'
                  },
                  constructor: Canvas
                };
                ///////////////////

                //_CanvasModalWidget() - constructor method encapsulates the application logic surrounding our modal
                // you can use this in your examples to manipulate the modal. The widget contains 2 canvases
                // 1) A 2D canvas used for our HUD display (we use this for PONG)
                // 2) The WebGL canvas we run our demos on
                function CanvasWidget(containerEl) {

                  var _canvasWidget = this,
                      _canvas2D = null,
                      _canvas3D = null,
                      _captionElement = null,
                      _canvasBody = null,
                      _canvasDetailBody = null,
                      _canvasFPSContainer = null;


                  function __addCanvas(id, type) {
                    var canvas = new Canvas(id, type);

                    if (! canvas.getCanvasEl()) {
                      return null;
                    }

                    return canvas;
                  }

                  function __initCanvasWidget() {

                    _captionElement = containerEl.find('.caption');
                    _canvasBody = containerEl.find('.canvas-body');
                    _canvasDetailBody = containerEl.find('.detail-body');
                    _canvasFPSContainer = containerEl.find('.fps-container');

                    __initCanvases();

                  }

                  function __initCanvases() {
                    _canvas2D = __addCanvas('hud-canvas', Canvas.prototype.CANVAS_TYPES.CANVAS_2D);
                    _canvas3D = __addCanvas('gl-canvas', Canvas.prototype.CANVAS_TYPES.CANVAS_3D);


                    if (_canvas2D && _canvas3D) {
                      _canvasBody
                          .append(_canvas2D.getCanvasJQObj().hide().addClass('canvas canvas-hud'))
                          .append(_canvas3D.getCanvasJQObj().addClass('canvas canvas-gl'));
                    }

                    //console.log(_canvas2D, _canvas3D);

                  }

                  // __resetCanvasWidget() everytime we dismiss the modal we clean up
                  // everything by destroying and recreating our 2D/3D canvases
                  function __resetCanvasWidget() {
                    if (_canvas2D) {
                      _canvas2D.destroy();
                    }

                    if (_canvas3D) {
                      _canvas3D.destroy();
                    }

                    __initCanvases();

                    return this;
                  }



                  function __modalFPSHide() {
                    _canvasFPSContainer.html('&nbsp;');
                  }


                  // initialize the Canvas Widget
                  __initCanvasWidget();

                  ///////////////////////////////////////////////////////////////
                  // Publically accessible Canvas Modal Widget API
                  ///////////////////////////////////////////////////////////////

                  _canvasWidget.getHUDContext = function() {
                    return _canvas2D.getContext();
                  };

                  _canvasWidget.getGLContext = function() {
                    return _canvas3D.getContext();
                  };

                  // get the jQuery object representing the webGL canvas
                  _canvasWidget.getGLCanvasEl = function() {
                    return _canvas3D.getCanvasJQObj();
                  };

                  _canvasWidget.getGLViewportAspectRatio = function() {
                    return _canvas3D.getViewportAspectRatio();
                  };

                  // get the jQuery object representing the HUD
                  _canvasWidget.get2DCanvasEl = function() {
                    return _canvas2D.getCanvasJQObj();
                  };

                  _canvasWidget.showHUDCanvas = function() {
                    _canvas3D.getCanvasJQObj().css({'zIndex': 0});
                    _canvas2D.getCanvasJQObj().fadeIn('fast').css({'zIndex': 1});
                    return this;
                  };

                  _canvasWidget.hideHUDCanvas = function() {
                    _canvas3D.getCanvasJQObj().css({'zIndex': 1});
                    _canvas2D.getCanvasJQObj().hide('fast').css({'zIndex': 0});
                    return this;
                  };

                  // clears the HUD from drawing
                  _canvasWidget.clearHUDCanvas = function() {
                    _canvas2D
                        .getContext()
                        .clearRect(0, 0, _canvas2D.getWidth(), _canvas2D.getHeight());
                  };

                  // we use this method to set the vertex and fragment shaders in one call and return the
                  // resultant webGL Program
                  _canvasWidget.setGLVertexAndFragmentShaders = function(vertexShaderStrOrID, fragmentShaderStrOrID) {
                    return _canvas3D.setVertexAndFragmentShaders(vertexShaderStrOrID, fragmentShaderStrOrID);
                  };

                  // give the user the option of getting the program - we could also provide a setter in the future
                  _canvasWidget.getGLProgram = function() {
                    return _canvas3D.getGLProgram();
                  };

                  // the title of the modal
                  _canvasWidget.setCaption = function(caption) {
                    _captionElement.html(caption);
                    return this;
                  };

                  // the text on the bottom on the modal
                  _canvasWidget.setDetailText = function(details) {
                    _canvasDetailBody.html(details);
                    return this;
                  };


                  _canvasWidget.FPSHide = __modalFPSHide;

                  // we use this method to show the Frames Per Second (FPS) (used in PONG)
                  _canvasWidget.setFPSVal = function(fps) {
                    _canvasFPSContainer.text('FPS: ' + fps);
                  };

                  // we can force our own cleanup of the canvases using this method
                  _canvasWidget.resetCanvasWidget = __resetCanvasWidget;

                };

              },
              link: function(scope, $element, attrs, pongDirectiveCtrl) {

                /////////////////////

                function _getAngularPlayer(pongPlayer) {
                  var attackingPlayer,
                      defendingPlayer;

                  // convert pong player into angular player
                  if (pongPlayer.getName() !== playerNames[0]) {
                    defendingPlayer = players[0];
                    attackingPlayer = players[1];
                  }
                  else {
                    defendingPlayer = players[1];
                    attackingPlayer = players[0];
                  }

                  return {
                    'attackingPlayer': attackingPlayer,
                    'defendingPlayer': defendingPlayer
                  };

                }

                function _regularPlayerBallVelolcity() {
                  var range =  [1, 2];

                  return  [
                    Math.max(Math.random() * range[1], range[0]),
                    Math.max(Math.random() * range[1], range[0])
                  ];
                }

                function _luckyPlayerBallVelolcity() {
                  var range =  [1, 1];

                  return range;
                }


                var playerNames = [],
                    playerNameMap = {},
                    pongCtrl = scope.pongCtrl,
                    players = pongCtrl.players,
                    gameOverlay = pongCtrl.gameOverlay,
                    isGamePaused = true;

                var OVERLAY_TIMEOUT_MS = 2000;

                for (var i = 0; i < players.length; i++) {
                  var playerName = players[i].name();
                    playerNames.push(playerName);
                    playerNameMap[playerName] = players[i];
                }


                pongDirectiveCtrl.init($element);

                var _game = $app.Pong(new pongDirectiveCtrl.CanvasWidget($element), webGLDrawUtilities)
                    .setPlayers(playerNames)
                    .setPlayersVelocityPercentageFn(function() { return 1; })
                    .setBallVelocityPercentageRangeFn(_regularPlayerBallVelolcity)
                    .on('gameWin', function(winner, losers) {

                      var game = this;

                      game.pause();

                      scope.$evalAsync(function() {
                        var winnerName = winner.getName();
                        gameOverlay.show = true;
                        gameOverlay.message = winnerName + ' Won!';
                        gameOverlay.playerTarget = winnerName;

                        playerNameMap[winnerName].won().score(winner.getScore());

                        var loser = losers[0];
                        playerNameMap[loser.getName()].lost();

                        $timeout(function() {
                          gameOverlay.show = false;
                          game.unpause();
                        }, OVERLAY_TIMEOUT_MS + 500);
                      });
                    })
                    .on('gamePausedState', function(isPaused) {
                      isGamePaused = isPaused;
                    })
                    .on('ballWillRebound',function(pongPlayer) {
                      var game = this,
                          angularPlayers = _getAngularPlayer(pongPlayer),
                          attackingPlayer = angularPlayers.attackingPlayer,
                          defendingPlayer = angularPlayers.defendingPlayer;

                      console.log(attackingPlayer.name() + ' WILL hit the ball!', 'WILL rebound to ' + defendingPlayer.name());

                      var isLuckyDay = defendingPlayer.isLuckyDay();

                      if (isLuckyDay) {
                        game.setBallVelocityPercentageRangeFn(_luckyPlayerBallVelolcity);
                      }
                      else {
                        game.setBallVelocityPercentageRangeFn(_regularPlayerBallVelolcity)
                      }

                      var playerVelocity = defendingPlayer.getPlayerSpeed();
                      if (isLuckyDay || playerVelocity > 1) {
                        // If the model has updated then do a digest
                        scope.$evalAsync(angular.noop);
                      }

                      game.setPlayersVelocityPercentageFn(function() {
                        return playerVelocity;
                      });


                    })
                    .on('ballRebound', function(pongPlayer) {
                      //console.log(playerNames, players, player.getName());
                      var game = this,
                          angularPlayers = _getAngularPlayer(pongPlayer),
                          attackingPlayer = angularPlayers.attackingPlayer,
                          defendingPlayer = angularPlayers.defendingPlayer;

                      if (attackingPlayer.willTaunt()) {

                        game.pause();

                        if (pongCtrl.isSoundOn === true) {
                          defendingPlayer.taunted();
                        }

                        scope.$apply(function() {
                          gameOverlay.show = true;
                          gameOverlay.isPlayerTaunt = true;
                          gameOverlay.playerTarget = defendingPlayer.name();
                          gameOverlay.message = defendingPlayer.name() + ' Taunted by ' + attackingPlayer.name();

                          $timeout(function() {
                            game.unpause();
                            gameOverlay.playerTarget = null;
                            gameOverlay.show = false;
                            gameOverlay.isPlayerTaunt = false;
                          }, OVERLAY_TIMEOUT_MS);
                        });

                        return true;
                      }




                     console.log(attackingPlayer.name() + ' hit the ball!', 'Rebounded to ' + defendingPlayer.name());
                      return false;
                    })
                    .start();


                  scope.$watch(function() {
                    return pongCtrl.isSoundOn;
                  },
                      function(isSoundOn) {

                    if (typeof isSoundOn !== 'boolean') {
                      return;
                    }
                    _game.setSoundOn(isSoundOn);
                  });

                  $element.click(function() {
                    if (! isGamePaused) {
                      _game.pause(true);
                    }
                    else {
                      _game.unpause(true);
                    }
                  });

                    ////////////////////////////////////////



              }
          };
      });
})();
