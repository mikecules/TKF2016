'use strict';

var $demos = $demos || {};


///////////////////////////////////////////////////////////////////////////////////////////////////////////
// Pong!!!
// @author: Michael Moncada <michael.moncada@gmail.com>
///////////////////////////////////////////////////////////////////////////////////////////////////////////
$demos.Pong = function Pong(canvasModalWidget, webGLDrawUtilities) {

      // get the gl context from our modal widget
      var _gl = null,
          _glProgram = null;



        ///////////////////////////////////////////////////////////////////////////////////////////////////
        //  _Sphere(radius) Constructor method is used to represent and Sphere with a radius
        //  this sphere can draw itself and adjust its orientation on the canvas via the accessor methods.
        ///////////////////////////////////////////////////////////////////////////////////////////////////
        function _Sphere(radius) {
          var __sphereData = null,
            __sphereVertexPositionBuffer = null,
            __sphereVertexIndexBuffer = null,
            __sphereVertexNormalBuffer = null,

            __colour = {r: 0.8, g: 0.8, b: 0.8, a: 1.0},
            __radius = radius || 1.0,
            __modelMatrix = mat4.create(),
            __rotationMatrix = mat4.create(),
            __translationMatrix = mat4.create(),
            __scaleMatrix = mat4.create(),
            __PVMMatrix = mat4.create(),
            __normalMatrix = mat3.create(),
            __shouldUpdateMatrices = true;

          function __init() {
            __sphereData = webGLDrawUtilities.createSphereVertexData(__radius);

            // create the buffer for vertex positions and assign it to that buffer to use for later
            __sphereVertexPositionBuffer = _gl.createBuffer();
            __sphereVertexPositionBuffer.itemSize = 3;
            __sphereVertexPositionBuffer.numItems = __sphereData.vertexPositionData.length / __sphereVertexPositionBuffer.itemSize;
            __sphereVertexPositionBuffer.items = new Float32Array(__sphereData.vertexPositionData);

            _gl.bindBuffer(_gl.ARRAY_BUFFER, __sphereVertexPositionBuffer);
            _gl.bufferData(_gl.ARRAY_BUFFER, __sphereVertexPositionBuffer.items, _gl.STATIC_DRAW);

            // create the buffer for vertex positions indexes and assign it to that buffer to use for later
            __sphereVertexIndexBuffer = _gl.createBuffer();
            __sphereVertexIndexBuffer.itemSize = 1;
            __sphereVertexIndexBuffer.numItems = __sphereData.vertexIndexData.length;
            __sphereVertexIndexBuffer.items = new Uint16Array(__sphereData.vertexIndexData);

            _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, __sphereVertexIndexBuffer);
            _gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER, __sphereVertexIndexBuffer.items, _gl.STATIC_DRAW);


            // create the buffer for vertex positions indexes and assign it to that buffer to use for later
            __sphereVertexNormalBuffer = _gl.createBuffer();
            __sphereVertexNormalBuffer.itemSize = 3;
            __sphereVertexNormalBuffer.numItems = __sphereData.vertexNormals.length / __sphereVertexNormalBuffer.itemSize;
            __sphereVertexNormalBuffer.items = new Float32Array(__sphereData.vertexNormals);


            _gl.bindBuffer(_gl.ARRAY_BUFFER, __sphereVertexNormalBuffer);
            _gl.bufferData(_gl.ARRAY_BUFFER, __sphereVertexNormalBuffer.items, _gl.STATIC_DRAW);


          }

          // draw itself
          function __draw() {


            mat4.multiply(__modelMatrix, __translationMatrix, __rotationMatrix);
            mat4.multiply(__modelMatrix, __modelMatrix, __scaleMatrix);

            // calculate the inverse, transpose of the model Matrix to make sure our surface normals are perpendicular to the surface again!!
            mat3.normalFromMat4(__normalMatrix, __modelMatrix);

            // View * Model
            mat4.multiply(__PVMMatrix, _glProgram.customAttribs.viewMatrix, __modelMatrix);

            // Perspective * (View * Model)
            mat4.multiply(__PVMMatrix, _glProgram.customAttribs.perspectiveMatrix, __PVMMatrix);



            // alright now assign the matrices back to the location of our vertex shader
            _gl.uniformMatrix3fv(_glProgram.customAttribs.u_NormalMatrixRef, false, __normalMatrix);
            _gl.uniformMatrix4fv(_glProgram.customAttribs.u_PVMMatrixRef, false, __PVMMatrix);

            // set the position buffer
            _gl.bindBuffer(_gl.ARRAY_BUFFER, __sphereVertexPositionBuffer);
            _gl.vertexAttribPointer(_glProgram.customAttribs.a_PositionRef, __sphereVertexPositionBuffer.itemSize, _gl.FLOAT, false, 0, 0);
            _gl.enableVertexAttribArray(_glProgram.customAttribs.a_PositionRef);

            // set the index buffer
            _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, __sphereVertexIndexBuffer);

            // bind the surface normal buffer
            _gl.bindBuffer(_gl.ARRAY_BUFFER, __sphereVertexNormalBuffer);
            _gl.vertexAttribPointer(_glProgram.customAttribs.a_VertexNormalRef, __sphereVertexNormalBuffer.itemSize, _gl.FLOAT, false, 0, 0);
            _gl.enableVertexAttribArray(_glProgram.customAttribs.a_VertexNormalRef);

            // make sure the sphere is in the correct colour
            _gl.uniform4f(_glProgram.customAttribs.u_FragColourRef, __colour.r, __colour.g, __colour.b, __colour.a);

            // draw the elements!
            _gl.drawElements(_gl.TRIANGLES, __sphereVertexIndexBuffer.numItems, _gl.UNSIGNED_SHORT, 0);

          }

          // rotate the sphere by x, y, z degrees
          function __rotateOnAxisByDegrees(x, y, z) {

            if (typeof x === 'number') {
              mat4.rotateX(__rotationMatrix, __rotationMatrix, glMatrix.toRadian(x));
            }

            if (typeof y === 'number') {
              mat4.rotateY(__rotationMatrix, __rotationMatrix, glMatrix.toRadian(y));
            }

            if (typeof z === 'number') {
              mat4.rotateZ(__rotationMatrix, __rotationMatrix, glMatrix.toRadian(z));
            }

            __shouldUpdateMatrices = true;

            return this;

          }


          // scale the sphere by s units
          function __scale(s) {
            if (typeof s === 'number') {
              mat4.scale(__scaleMatrix, __scaleMatrix, vec3.fromValues(s, s, s));
            }

            __shouldUpdateMatrices = true;

            return this;
          }

          // translate the sphere by (x, y, z) units
          function __translate(x, y, z) {

            mat4.translate(__translationMatrix, __translationMatrix, vec3.fromValues(x, y, z));

            __shouldUpdateMatrices = true;

            return this;
          }

          __init();

          ////////////////////////////////////////////////////////
          // _Sphere public API
          ////////////////////////////////////////////////////////
          this.rotateOnAxisByDegrees = __rotateOnAxisByDegrees;

          this.draw = __draw;

          this.scale = __scale;

          this.translate = __translate;

          // sets the colour of the primitive
          this.setColour = function(r, g, b, a) {
            __colour.r = r;
            __colour.g = g;
            __colour.b = b;
            __colour.a = a;

            return this;
          };

          this.getRadius = function() {
            return __radius;
          };


          return this;
        }

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////
        //  _Quad(x, y, z) Constructor method is used to represent and Quadrilateral (rectangle) with
        //  width, height and depth (x, y ,z) dimensions respectively.ß
        //  This quadrilateral can draw itself and adjust its orientation on the canvas via the accessor methods.
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////
        function _Quad(x, y, z) {

          var __quadData = null,
            __quadVertexPositionBuffer = null,
            __quadVertexIndexBuffer = null,
            __quadVertexNormalBuffer = null,

            __colour = {r: 1.0, g: 0.0, b: 1.0, a: 1.0},

            __modelMatrix = mat4.create(),
            __rotationMatrix = mat4.create(),
            __translationMatrix = mat4.create(),
            __scaleMatrix = mat4.create(),
            __PVMMatrix = mat4.create(),
            __normalMatrix = mat3.create(),
            __shouldUpdateMatrices = true;

          function __init() {
            __quadData = webGLDrawUtilities.createCubeVertexData(x, y, z);

            // create the buffer for vertex positions and assign it to that buffer to use for later
            __quadVertexPositionBuffer = _gl.createBuffer();
            __quadVertexPositionBuffer.itemSize = 3;
            __quadVertexPositionBuffer.numItems = __quadData.vertexPositionData.length / __quadVertexPositionBuffer.itemSize;
            __quadVertexPositionBuffer.items = new Float32Array(__quadData.vertexPositionData);

            _gl.bindBuffer(_gl.ARRAY_BUFFER, __quadVertexPositionBuffer);
            _gl.bufferData(_gl.ARRAY_BUFFER, __quadVertexPositionBuffer.items, _gl.STATIC_DRAW);

            // create the buffer for vertex positions indexes and assign it to that buffer to use for later
            __quadVertexIndexBuffer = _gl.createBuffer();
            __quadVertexIndexBuffer.itemSize = 1;
            __quadVertexIndexBuffer.numItems = __quadData.vertexIndexData.length;
            __quadVertexIndexBuffer.items = new Uint16Array(__quadData.vertexIndexData);

            _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, __quadVertexIndexBuffer);
            _gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER, __quadVertexIndexBuffer.items, _gl.STATIC_DRAW);

            // create the buffer for vertex positions indexes and assign it to that buffer to use for later
            __quadVertexNormalBuffer = _gl.createBuffer();
            __quadVertexNormalBuffer.itemSize = 3;
            __quadVertexNormalBuffer.numItems = __quadData.vertexNormals.length / __quadVertexNormalBuffer.itemSize;
            __quadVertexNormalBuffer.items = new Float32Array(__quadData.vertexNormals);

            _gl.bindBuffer(_gl.ARRAY_BUFFER, __quadVertexNormalBuffer);
            _gl.bufferData(_gl.ARRAY_BUFFER, __quadVertexNormalBuffer.items, _gl.STATIC_DRAW);


          }

          // this function works in EXACTLY the same way as our sphere __draw function! Please refer to that
          function __draw() {


            mat4.multiply(__modelMatrix, __translationMatrix, __rotationMatrix);
            mat4.multiply(__modelMatrix, __modelMatrix, __scaleMatrix);

            // calculate the inverse transformation that will remove caused by transforming the 3D surface
            mat3.normalFromMat4(__normalMatrix, __modelMatrix);

            mat4.multiply(__PVMMatrix, _glProgram.customAttribs.viewMatrix, __modelMatrix);
            mat4.multiply(__PVMMatrix, _glProgram.customAttribs.perspectiveMatrix, __PVMMatrix);

            __shouldUpdateMatrices = false;


            _gl.uniformMatrix3fv(_glProgram.customAttribs.u_NormalMatrixRef, false, __normalMatrix);
            _gl.uniformMatrix4fv(_glProgram.customAttribs.u_PVMMatrixRef, false, __PVMMatrix);


            _gl.bindBuffer(_gl.ARRAY_BUFFER, __quadVertexPositionBuffer);
            _gl.vertexAttribPointer(_glProgram.customAttribs.a_PositionRef, __quadVertexPositionBuffer.itemSize, _gl.FLOAT, false, 0, 0);
            _gl.enableVertexAttribArray(_glProgram.customAttribs.a_PositionRef);


            _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, __quadVertexIndexBuffer);


            _gl.bindBuffer(_gl.ARRAY_BUFFER, __quadVertexNormalBuffer);
            _gl.vertexAttribPointer(_glProgram.customAttribs.a_VertexNormalRef, __quadVertexNormalBuffer.itemSize, _gl.FLOAT, false, 0, 0);
            _gl.enableVertexAttribArray(_glProgram.customAttribs.a_VertexNormalRef);


            _gl.uniform4f(_glProgram.customAttribs.u_FragColourRef, __colour.r, __colour.g, __colour.b, __colour.a);

            _gl.drawElements(_gl.TRIANGLES, __quadVertexIndexBuffer.numItems, _gl.UNSIGNED_SHORT, 0);

          }

          // Note that the sphere and quads function constructors or so similar we could have created a basic JS Prototype to provide the basic functionality
          // I just wanted to keep it simple for code readability - and I am lazy - that too...
          function __rotateOnAxisByDegrees(x, y, z) {

            if (typeof x === 'number') {
              mat4.rotateX(__rotationMatrix, __rotationMatrix, glMatrix.toRadian(x));
            }

            if (typeof y === 'number') {
              mat4.rotateY(__rotationMatrix, __rotationMatrix, glMatrix.toRadian(y));
            }

            if (typeof z === 'number') {
              mat4.rotateZ(__rotationMatrix, __rotationMatrix, glMatrix.toRadian(z));
            }

            __shouldUpdateMatrices = true;
            return this;

          }


          function __scale(s) {
            if (typeof s === 'number') {
              mat4.scale(__scaleMatrix, __scaleMatrix, vec3.fromValues(s, s, s));
            }
            __shouldUpdateMatrices = true;
            return this;
          }

          function __translate(x, y, z) {

            mat4.translate(__translationMatrix, __translationMatrix, vec3.fromValues(x, y, z));
            __shouldUpdateMatrices = true;
            return this;
          }

          __init();


          ////////////////////////////////////////////////////////
          // _Quad public API
          ////////////////////////////////////////////////////////
          this.rotateOnAxisByDegrees = __rotateOnAxisByDegrees;

          this.draw = __draw;

          this.scale = __scale;

          this.translate = __translate;

          this.setColour = function(r, g, b, a) {
            __colour.r = r;
            __colour.g = g;
            __colour.b = b;
            __colour.a = a;

            return this;
          };




          return this;


        }



    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  _init() sets some gl program defaults and grabs the location to our attributes/uniforms in our shaders...
    // The function then starts the game loop
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    function _init() {

      _gl = canvasModalWidget.getGLContext();

      if (! _gl) {
              throw new Error('Could not run lightingExample() WebGL Demo!');
          }





       // Set clear color to black, fully opaque
          _gl.clearColor(0.0, 0.0, 0.0, 1.0);

          // dealing with 3D space geometry so make sure this feature is enabled
          _gl.enable(_gl.DEPTH_TEST);

      // get the shaders and compile them - the resultant will be a program that is automatically joined to the gl context in the background
          _glProgram = canvasModalWidget.setGLVertexAndFragmentShaders('#v-shader-demo6', '#f-shader-demo6');
          _glProgram.customAttribs = {};


      // Get the storage locations of all the customizable shader variables
      _glProgram.customAttribs.a_PositionRef = _gl.getAttribLocation(_glProgram, 'a_Position'),
      _glProgram.customAttribs.a_VertexNormalRef = _gl.getAttribLocation(_glProgram, 'a_VertexNormal'),

      _glProgram.customAttribs.u_FragColourRef = _gl.getUniformLocation(_glProgram, 'u_FragColour'),
      _glProgram.customAttribs.u_PVMMatrixRef = _gl.getUniformLocation(_glProgram, 'u_PVMMatrix'),
      _glProgram.customAttribs.u_NormalMatrixRef = _gl.getUniformLocation(_glProgram, 'u_NormalMatrix'),


      _glProgram.customAttribs.u_AmbientColourRef = _gl.getUniformLocation(_glProgram, 'u_AmbientColour'),
      _glProgram.customAttribs.u_LightingDirectionRef = _gl.getUniformLocation(_glProgram, 'u_LightingDirection'),
      _glProgram.customAttribs.u_DirectionalColourRef = _gl.getUniformLocation(_glProgram, 'u_DirectionalColour');


      _glProgram.customAttribs.eyePosition = vec3.fromValues(0, 0, 5);
      _glProgram.customAttribs.centerPoint = vec3.fromValues(0, 0, -50);


      var perspectiveMatrix = mat4.create(), // get the identity matrix
        viewMatrix = mat4.create(),
        modelMatrix = mat4.create(),
        PVMMatrix = mat4.create();


      mat4.perspective(perspectiveMatrix, glMatrix.toRadian(45.0), canvasModalWidget.getGLViewportAspectRatio(), 1, 1000);
      mat4.lookAt(viewMatrix, _glProgram.customAttribs.eyePosition, _glProgram.customAttribs.centerPoint, vec3.fromValues(0, 1, 0));

      _glProgram.customAttribs.viewMatrix = viewMatrix;
      _glProgram.customAttribs.modelMatrix = modelMatrix;
      _glProgram.customAttribs.perspectiveMatrix = perspectiveMatrix;

      mat4.multiply(PVMMatrix, perspectiveMatrix, viewMatrix);

      _glProgram.customAttribs.PVMMatrix = PVMMatrix;

      _gl.uniformMatrix4fv(_glProgram.customAttribs.u_PVMMatrixRef, false, _glProgram.customAttribs.PVMMatrix);

      // set our directional light which is pointing 10 units to the left 10 units upwards away 5 units from the user 
      _glProgram.customAttribs.lightingDirection  = _setLightingDirection(-10.0, 10.0, -5.0);

      _gl.uniform3fv(_glProgram.customAttribs.u_LightingDirectionRef, _glProgram.customAttribs.lightingDirection);
      _gl.uniform3f(_glProgram.customAttribs.u_AmbientColourRef, 0.5, 0.5, 0.5);

      _gl.uniform3f(_glProgram.customAttribs.u_DirectionalColourRef, 1.0, 1.0, 1.0);

      // start the game!!
      (new _Game()).start();

      }

      function _setLightingDirection(x, y, z) {
        var n = vec3.create(),
            v = vec3.fromValues(x, y, z);

        // make sure this is a unit vector!
        vec3.normalize(n, v);

        // we want the vector to point in the opposite direction for our calculation
        // in the vertex shader
        vec3.scale(n, n, -1.0);

        return n;
      }


      ////////////////////////////////////////////////////////////////////////////////////////
      // Game object
      ////////////////////////////////////////////////////////////////////////////////////////
      function _Game() {
         var  __GAME_STATES = {RUNNING: 0, PAUSED: 1},
              __DIRECTIONS = {NORTH: 2, EAST: 4, SOUTH: 8, WEST: 16, NONE: 0},
              __map = null,
              __players = [],
              __thePlayer = null,
              __ball = null,
              __gameStatus =  __GAME_STATES.PAUSED,
              __hasGameStarted = false,
              __HUDContext = null,
              __lastDrawTime = 0,
              __frameCounter = 0,
              __lastFrameDisplayDeltaTime = 0,
              __isAppRunning = true,
              __keyPressed = {},
              __keyReleased = {},
              __robotErrorPercentage = 40, // make the robot mess up 40% of the time
              __robotVelocityPenalty = 0,
              __ROBOT_VELOCITY_PENALITY_PERCENTAGE = 1.0 - 9.0/10.0; // drop the robot's efficiency by this percentage. (10% of the delta time)

        function __showTitleScreen() {
          var HUDEl = canvasModalWidget.get2DCanvasEl();

          // clear the 2D canvas before drawing our stats!
          canvasModalWidget.clearHUDCanvas();

          __HUDContext.font = '24px "Verdana"';
          __HUDContext.fillStyle = 'rgba(255, 255, 255, 1.0)'; // Set the font colour
          __HUDContext.fillText('Pong', 270, 180);

          __HUDContext.fillStyle = 'rgba(204, 229, 255, 1.0)';
          __HUDContext.fillText('GL', 330, 180);

          __HUDContext.fillStyle = 'rgba(255, 204, 204, 1.0)';
          __HUDContext.font = '18px "Verdana"';

          // display the right messaging
          if (__isGamePaused() === true && __hasGameStarted) {
            __HUDContext.fillText('Press Space Bar to unpause...', 190, 210);
            __HUDContext.fillStyle = 'rgba(219, 204, 255, 1.0)';
            __HUDContext.fillText('Your Score: ' + __thePlayer.getScore(), 10, 20);
            __HUDContext.fillStyle = 'rgba(255, 204, 204, 1.0)';
            __HUDContext.fillText('Robot Score: ' + __players[1].getScore(), 10, 40);
          }
          else { // game intro messaging
            __HUDContext.fillText('Press Space Bar to start...', 200, 210);
          }

          // show the 2D HUD Canvas
          canvasModalWidget.showHUDCanvas();
        }

        ///////////////////////////////////////////////////////////////////////////////
        // __Rect provides some basic structures to encapsulate
        // bounding rectangles for our game objects that we can check against
        // useful for determining if the ball went out of bounds...
        ///////////////////////////////////////////////////////////////////////////////
        function __Rect(x, y, width, height) {
          this.x1 = x || 0;
          this.y1 = y || 0;
          this.width = width || 0;
          this.height = height || 0;
          this.x2 = this.x1 + this.width;
          this.y2 = this.y1 + this.height;

          return this;
        }

        ///////////////////////////////////////////////////////////////////////////////
        // __Position provides some basic structures to encapsulate
        // the location of our game objects...
        ///////////////////////////////////////////////////////////////////////////////
        function __Position(x, y, z) {
          this.x = x || 0;
          this.y = y || 0;
          this.z = z || 0;

          return this;
        }

        ///////////////////////////////////////////////////////////////////////////////
        // __Player encapsulates our player (essentially a paddle...)
        // It is capable of drawing itself at a position based on the delta time which
        // is in milliseconds (using it's velocity)
        ///////////////////////////////////////////////////////////////////////////////
        function __Player(position, boundingRect, playerType) {
          var ___paddle = null,
              ___score = 0,
              ___playerType = playerType === __Player.prototype.PLAYER_TYPE.HUMAN ? playerType : __Player.prototype.PLAYER_TYPE.ROBOT,
              ___playerPosition = position || new __Position(),
              ___playerBoundingRect = boundingRect,
              ___velocity = {x: 0.003, y: 0},
              ___movingDirection = __DIRECTIONS.NONE,
              ___paddleDimensions = {x: 0.5, y: 0.05, z: 0.1};


          function ___init() {
            ___paddle = new _Quad(___paddleDimensions.x, ___paddleDimensions.y, ___paddleDimensions.z);
            ___paddle.translate(___playerPosition.x, ___playerPosition.y, ___playerPosition.z);
          }


          function ___draw() {
            ___paddle.draw();
          }

          // update the player's position is 3D Space based off the delta time in milliseconds
          function ___update(tickDeltaMS) {

            var shouldUpdatePosition = true,
                playerVelocityX = ___velocity.x;

            if (___movingDirection === __DIRECTIONS.NONE) {
              return;
            }


            switch (___movingDirection) {
              case __DIRECTIONS.EAST:
                playerVelocityX = -playerVelocityX;
              break;

              case __DIRECTIONS.WEST:
              break;

              default:
                shouldUpdatePosition = false;
              break;
            }

            if (! shouldUpdatePosition) {
              return;
            }

            var distance = tickDeltaMS * playerVelocityX,
                newXPosition = ___playerPosition.x + distance;

            //console.log(newXPosition, ___playerBoundingRect.x2);

            // don't let the paddle fall out of our bounding rect's X axis
            if ((newXPosition < - ___playerBoundingRect.x2) || (newXPosition > ___playerBoundingRect.x2)) {
              return;
            }

             ___playerPosition.x += distance;

             ___paddle.translate(distance , 0, 0);



          }

          function ___setDirection(direction) {
            ___movingDirection = direction;
          }


          ___init();

          // __Player Public API
          this.getScore = function() {
            return ___score;
          };

          this.setScore = function(score) {
            ___score = score;
          };

          this.draw = ___draw;
          this.update = ___update;
          this.setDirection = ___setDirection;


          this.setColour = function(r, g, b) {
            ___paddle.setColour(r, g, b, 1);
            return this;
          };

          this.getPosition = function() {
            return ___playerPosition;
          };

          this.getDirection = function() {
            return ___movingDirection;
          };


          this.getDimensions = function() {
            return ___paddleDimensions;
          };

          this.setVelocityX = function(x) {
            ___velocity.x = x;
            return this;
          };


          return this;

        }

        // Because I felt guilty for not using a prototype anywhere...
        __Player.prototype.PLAYER_TYPE = {ROBOT: 0, HUMAN: 1};


        ///////////////////////////////////////////////////////////////////////////////
        // __Ball encapsulates our player (essentially a sphere...)
        // It is capable of drawing itself at a position based on the delta time which
        // is in milliseconds (using it's velocity)
        ///////////////////////////////////////////////////////////////////////////////
        function __Ball(position, boundingRect) {
          var   ___ball = null,
                ___ballPosition = position || new __Position(),
                ___ballBoundingRect = boundingRect,
                ___velocity = {x: 0.002, y: 0.002},
                ___movingDirection = __DIRECTIONS.NONE,
                ___radius = 0.1;


          function ___init() {
            ___ball = new _Sphere(___radius);
            ___ball.translate(___ballPosition.x, ___ballPosition.y, ___ballPosition.z);
          }

          function ___draw() {
            ___ball.draw();
          }


          // update the ball's position is 3D Space based off the delta time in milliseconds
          function ___update(tickDeltaMS) {


            if (___movingDirection === __DIRECTIONS.NONE) {
              return;
            }




            var distanceX = tickDeltaMS * ___velocity.x;
            var distanceY = tickDeltaMS * ___velocity.y;

            var newXPosition = ___ballPosition.x + distanceX;
            var newYPosition = ___ballPosition.y + distanceY;

            // used to update the ball's current direction
            var newDirection = __DIRECTIONS.NONE;


           //console.log('x ', newXPosition, ___ballBoundingRect.x2);
            //console.log('y' , newYPosition, ___ballBoundingRect.y2);



            // don't let the ball fall out of our bounding rect's X axis
            if (newXPosition < - ___ballBoundingRect.x2 || newXPosition > ___ballBoundingRect.x2) {
              ___velocity.x = -___velocity.x;
               distanceX = -distanceX;
            }

            // don't let the ball fall out of our bounding rect's Y axis
            if (newYPosition < - ___ballBoundingRect.y2 || newYPosition > ___ballBoundingRect.y2) {
              ___velocity.y = -___velocity.y;
              distanceY = -distanceY;
            }

            if (___velocity.x < 0) {
                newDirection = __DIRECTIONS.WEST;
                //console.log('west')
            }
            else {
              newDirection = __DIRECTIONS.EAST;
               //console.log('east')
            }


            // merge the NORTH/SOUTH Directional bit in our resultant direction variable
            if ( ___velocity.y < 0 ) {
                newDirection |= __DIRECTIONS.SOUTH;
                //console.log('south')
            }
            else {
              newDirection |= __DIRECTIONS.NORTH;
              //console.log('north')
            }




            ___movingDirection = newDirection;




             ___ballPosition.x += distanceX;
             ___ballPosition.y += distanceY;

             ___ball.translate(distanceX, distanceY, 0);



          }

          // do some initial velocity calculations based on the direction passed in
          function ___setDirection(direction) {
            if (
                ((direction & __DIRECTIONS.SOUTH) && ___velocity.y > 0) ||
                ((direction & __DIRECTIONS.NORTH) && ___velocity.y < 0)
              ) {
              ___velocity.y = -___velocity.y;
            }

            if (
                ((direction & __DIRECTIONS.WEST) && ___velocity.x > 0) ||
                ((direction & __DIRECTIONS.EAST) && ___velocity.x < 0)
              ) {
              ___velocity.x = -___velocity.x;
            }

            ___movingDirection = direction;
          }

          ___init();


          // __Ball Public API
          this.draw = ___draw;
          this.update = ___update;
          this.setDirection = ___setDirection;

          this.getPosition = function() {
            return ___ballPosition;
          };

          this.getDirection = function() {
            return ___movingDirection;
          };

          this.getRadius = function() {
            return ___radius;
          };

          this.getBoundingRect = function() {
            return ___ballBoundingRect;
          };

          this.rebound = function() {
             ___velocity.y = -___velocity.y;
          };


          return this;
        }

      //////////////////////////////////////////////////////////////////////////////////////////
      // __Map encapsulates our toronto-map (essentially a bunch of rectangles that creates a fence...)
      // It is capable of drawing itself and doesn't do much else - except looking pretty.
      //////////////////////////////////////////////////////////////////////////////////////////
      function __Map() {
        var ___leftWall = null,
            ___rightWall = null;

        function ___init() {
          var wallDimensions = {x: 0.05, y: 2, z: 0.1},
              wallColour = {r:0.4, g:0.4, b:0.5},
              translate = {x: 2.6, y: 0, z: 0};


          ___leftWall = new _Quad(wallDimensions.x, wallDimensions.y, wallDimensions.z);
          ___leftWall
            .setColour(wallColour.r, wallColour.g , wallColour.b, 1)
            .translate(-translate.x, translate.y, translate.z);

         ___rightWall = new _Quad(wallDimensions.x, wallDimensions.y, wallDimensions.z);
         ___rightWall
            .setColour(wallColour.r, wallColour.g , wallColour.b, 1)
            .translate(translate.x, translate.y, translate.z);
        }

        function ___draw() {
          ___leftWall.draw();
          ___rightWall.draw();
        }

        function ___update(tickMS) {

        }



        ___init();

        // __Map public API
        this.draw = ___draw;
        this.update = ___update;

        return this;
      }


      function __setGamePauseStatus(state) {
        var newGameStatus = (state === true ? __GAME_STATES.PAUSED : __GAME_STATES.RUNNING);


        if (newGameStatus === __gameStatus) {
          return;
        }

        __gameStatus = newGameStatus;

        if (__gameStatus === __GAME_STATES.PAUSED) {
          __showTitleScreen();
        }
        else {
          canvasModalWidget.hideHUDCanvas();
        }

      }

      function __getGameStatus() {
        return __gameStatus;
      }

      function __isGamePaused() {
        return __getGameStatus() === __GAME_STATES.PAUSED;
      }


      ///////////////////////////////////////////////////////////////////////////
      // __initGame() does some initial work to set some variables and bind
      // our keyboard listener
      ///////////////////////////////////////////////////////////////////////////
      function __initGame() {

        __HUDContext = canvasModalWidget.getHUDContext();

        __showTitleScreen();
        __bindKeyEvents();

        // reset the FPS meter
        canvasModalWidget.setFPSVal(0);

        __resetGame();


      }

      ///////////////////////////////////////////////////////////////////////////
      // __resetGame() creates our basic game data structures and starts
      // our main game loop (__tick)
      ///////////////////////////////////////////////////////////////////////////
      function __resetGame() {

        // reset the timer counter variables
        __lastDrawTime = 0;
        __frameCounter = 0;

        // the players positions in 3D space
        var playerPosition = {x: 0.0, y: -1.9, z: 0.0};

        // create the Map object
        __map = new __Map();


        // create the Ball object
        __ball = new __Ball(null, new __Rect(0, 0, 2.5, 2));

        // remove any old players (we want to draw all our game objects from scratch!)
        __players.length = 0;

        // add the players to the game
        __players.push(new __Player(new __Position(playerPosition.x, playerPosition.y, playerPosition.z),  new __Rect(playerPosition.x, playerPosition.y, 2.08, 1), __Player.prototype.PLAYER_TYPE.HUMAN).setColour(0,0,1));
        __players.push(new __Player(new __Position(playerPosition.x, -playerPosition.y, playerPosition.z),  new __Rect(playerPosition.x, -playerPosition.y, 2.08, 1), __Player.prototype.PLAYER_TYPE.ROBOT).setColour(0,1,0));

        // make note of the human player
        __thePlayer = __players[0];


        // using bitwise ORs to be able to easily evaluate the direction
        // the ball is moving in
        var possibleBallDirections = [
          __DIRECTIONS.EAST | __DIRECTIONS.NORTH,
          __DIRECTIONS.WEST | __DIRECTIONS.NORTH,
          __DIRECTIONS.EAST | __DIRECTIONS.SOUTH,
          __DIRECTIONS.WEST | __DIRECTIONS.SOUTH
        ];

        // randomize the direction of the ball!
        __ball.setDirection(possibleBallDirections[Math.floor((Math.random() * possibleBallDirections.length) + 1)]);

        // start the game loop!
        __tick();
      }

      ///////////////////////////////////////////////////////////////////////////
      // __playerWon() increments the user's score then wipes the game objects
      // and replaces them with new ones while retaining the prior scores.
      ///////////////////////////////////////////////////////////////////////////
      function __playerWon(player) {
        var playerScores = [];

        for (var i = 0; i < __players.length; i++) {
          var p = __players[i],
                  playerScore = p.getScore();

          if (p === player) {
            playerScore++;
          }

          playerScores.push(playerScore);

        }

        //console.log()

        __setGamePauseStatus(true);
        __resetGame(playerScores);

        for (var i = 0; i < __players.length; i++) {
          var p = __players[i];
          p.setScore(playerScores[i]);
        }

        __showTitleScreen();

      }


      ///////////////////////////////////////////////////////////////////////////
      // __rotateMap() moves and rotates our camera view based on keyboard
      // input.
      ///////////////////////////////////////////////////////////////////////////
      function __rotateMap(rotationX, rotationY, zoomZ) {
        __setGamePauseStatus(true);

        var viewMatrix = mat4.create();

        // rotates our X,Y locations of our camera
        if (rotationX) {
          var rotationInRadsX = glMatrix.toRadian(rotationX);
          vec3.rotateX(_glProgram.customAttribs.eyePosition, _glProgram.customAttribs.eyePosition, vec3.fromValues(0,0,0), rotationInRadsX);
          vec3.rotateX(_glProgram.customAttribs.centerPoint, _glProgram.customAttribs.centerPoint, vec3.fromValues(0,0,0), rotationInRadsX);
        }

        if (rotationY) {
          var rotationInRadsY = glMatrix.toRadian(rotationY);
          vec3.rotateY(_glProgram.customAttribs.eyePosition, _glProgram.customAttribs.eyePosition, vec3.fromValues(0,0,0), rotationInRadsY);
          vec3.rotateY(_glProgram.customAttribs.centerPoint, _glProgram.customAttribs.centerPoint, vec3.fromValues(0,0,0), rotationInRadsY);
        }

        // moves our camera in closer to the screen (only along the z-axis)
        if (zoomZ) {
          //console.log(_glProgram.customAttribs.eyePosition);
          vec3.add(_glProgram.customAttribs.eyePosition, _glProgram.customAttribs.eyePosition, vec3.fromValues(0, 0, zoomZ));
          //console.log(_glProgram.customAttribs.eyePosition);
        }


        mat4.lookAt(viewMatrix, _glProgram.customAttribs.eyePosition, _glProgram.customAttribs.centerPoint, vec3.fromValues(0, 1, 0));
        _glProgram.customAttribs.viewMatrix = viewMatrix;

      }

    ///////////////////////////////////////////////////////////////////////////
    // __bindKeyEvents() adds our keyboard listeners which we use throughout
    // our game.
    ///////////////////////////////////////////////////////////////////////////
    function __bindKeyEvents() {
      var KEY_PRESS_EVENT = 'keydown.pong3D',
          KEY_RELEASE_EVENT = 'keyup.pong3D',
          __window = $(window);

      __window
        .on(KEY_PRESS_EVENT, function(event) {
          event.stopPropagation();
          event.preventDefault();
          __keyPressed[event.which] = true;
          //console.log('key down' + event.which);
        });

      __window
        .on(KEY_RELEASE_EVENT, function(event) {
          event.stopPropagation();
          event.preventDefault();
          __keyReleased[event.which] = true;
          //console.log(event.which);
        });

      // when the modal is closed remove our key press listeners
      canvasModalWidget.onHide(function() {
        __isAppRunning = false;

        __window
          .unbind(KEY_PRESS_EVENT);

        __window
          .unbind(KEY_RELEASE_EVENT);
        //console.log('cancel request animation');
      });

    }



    ///////////////////////////////////////////////////////////////////////////
    // __processInput() does the work of updating a game objects based on our
    // user's input.
    ///////////////////////////////////////////////////////////////////////////
    function __processInput() {
      var degreeInc = 2.0,
          zInc = 0.05;
      //console.log(_keyPressed);


      for (var keyCode in __keyPressed) {

        if (! __keyPressed[keyCode]) {
          continue;
        }

        var key = parseInt(keyCode);


        switch(key) {
          case 87: // rotate up keys = (w, W)
          case 119:
            __rotateMap(degreeInc);
          break;

          case 83:  // rotate down keys = (s, S)
          case 115:
            __rotateMap(-degreeInc);
          break;

          case 65: // rotate left keys = (a, A)
          case 97:
            __rotateMap(null, degreeInc);
          break;

          case 68: // rotate right keys = (d, D)
          case 100:
            __rotateMap(null, -degreeInc);
          break;

          case 32: // space bar
            __hasGameStarted = true;
            __setGamePauseStatus(! __getGameStatus());
          break;

          case 37: // move player left
            if (! __isGamePaused()) {
              __thePlayer.setDirection(__DIRECTIONS.EAST);
            }
          break;

          case 39: // move player right
            if (! __isGamePaused()) {
              __thePlayer.setDirection(__DIRECTIONS.WEST);
            }
          break;

          case 49: // zoom out
            __rotateMap(null, null, -zInc);
          break;

          case 50: // zoom in
            __rotateMap(null, null, zInc);
          break;

          default:
            console.log('Did not recognize key with code: ' + keyCode)
          break;
        }

        if (key === 32 || (__keyPressed[keyCode] && __keyReleased[keyCode])) {

          switch (key) {
            case 37: // stop player
            case 39:
                  __thePlayer.setDirection(__DIRECTIONS.NONE);
              break;

            default:
            break;
          }

          __keyPressed[keyCode] = false;
          __keyReleased[keyCode] = false;
          //console.log(__keyReleased);
        }

      }
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////
    // __tick() (our game loop) does the heavy lifting work of updating a game objects based on our
    // user's input. It also provides a means to determine how far our game has progressed from the
    // last time the frame was drawn.
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    function __tick() {


        var player = null,
            count = 0,
            tickTime = (new Date()).getTime(),
            dt = 0,
            playerDimensions = __thePlayer.getDimensions(),
            ballRadius = __ball.getRadius(),
            ballBoundingRect = __ball.getBoundingRect();


        if (__lastDrawTime === 0) {
          __lastDrawTime = tickTime;
        }

        dt = tickTime - __lastDrawTime;

        __lastFrameDisplayDeltaTime += dt;
        __frameCounter++;

        if (__lastFrameDisplayDeltaTime >= 1000)  {
           canvasModalWidget.setFPSVal(__frameCounter);

          __frameCounter = 0;
          __lastFrameDisplayDeltaTime = 0;
        }


        //console.log(__lastFrameDisplayDeltaTime)


        // Clear the color and depth buffer because now we are dealing with perspective and camera space.
        // and we want everything to look natural...
        _gl.clear(_gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT);


        __processInput();


        // if the game hasn't been paused...
        if (! __isGamePaused()) {

          // calculate the new ball's position
          __ball.update(dt);

          // get the new ball's position and direction
          var ballPosition = __ball.getPosition(),
              ballDirection = __ball.getDirection();


           for (count = 0; count < __players.length; count++) {
            player = __players[count];

            /*
                   y2--------------------------------------------|
                x1 |--------- playerPosition.x (center) ---------| x2
                   y1--------------------------------------------|
            */
            // calculate our player boundries based off of it's position in space
            // we use this to determine where a collision happens
            // and also where to move our robot so he/she/it does not miss the
            // ball.
            var playerPosition = player.getPosition(),
                x1 = playerPosition.x - playerDimensions.x,
                x2 = playerPosition.x + playerDimensions.x,
                y1 = playerPosition.y - playerDimensions.y,
                y2 = playerPosition.y + playerDimensions.y;

            if (player  !== __thePlayer) {

              // is the robot going to screw up - we randomize it's chance
              var willRobotWillMessUpThisFrame = (1 + Math.floor(Math.random() * 100)) > __robotErrorPercentage ? false : true;

              // the robot's mistakes will be cumulative until it stops failing...
              if (willRobotWillMessUpThisFrame) {
                __robotVelocityPenalty += dt * __ROBOT_VELOCITY_PENALITY_PERCENTAGE; // git it to go slower
              }
              else {
                __robotVelocityPenalty -= dt * __ROBOT_VELOCITY_PENALITY_PERCENTAGE; // get it to go faster

                if (__robotVelocityPenalty < 0) {
                  __robotVelocityPenalty = 0;
                }

              }

              //console.log(lowerBound, upperBound);

              // if the lower bound X is less then the ball center X and the upper bound is greater than the ball center stay still
              if (x1 < ballPosition.x &&  ballPosition.x < x2) {
                player.setDirection(__DIRECTIONS.NONE);
              }
              // if the the ball center X is greater than the right extremity of the player go east quickily
              else if (ballPosition.x < x2) {
                player.setDirection(__DIRECTIONS.EAST);
              }

              // otherwise go south
              else {
                player.setDirection(__DIRECTIONS.WEST);
              }

              
             
            }

            if (player === __thePlayer) {
              // update the player's position
              player.update(dt);
            }
            else {
              // penalize the robot by slowing it down if its made a mistake but
              // not so much the it the player looks too janky
              player.update(Math.max(10, dt - __robotVelocityPenalty));
            }

            // used to calculate who's potentially going to hit the ball
            var potentialPlayerCollision = null,
                inPlayerYRange = null,
                ballYToHit = 0;

            // if the ball is moving north then it's going to the robot
            if (ballDirection & __DIRECTIONS.NORTH) {
              potentialPlayerCollision = __players[1];
              ballYToHit = (ballPosition.y + ballRadius);
              inPlayerYRange = y1 <= ballYToHit;
              //console.log('computer');
            }
            else { // it's coming to us
              potentialPlayerCollision = __thePlayer;
              ballYToHit =  (ballPosition.y - ballRadius);
              inPlayerYRange = y2 >= ballYToHit;
              //console.log('player');
            }

            // if the current player being updated isn't set for a collision ignore them
            if (player !== potentialPlayerCollision) {
              continue;
            }

            // alright, if the paddle is in place where the ball is moving rebound the ball
            if (x1  < ballPosition.x &&  ballPosition.x < x2 && inPlayerYRange) {
              __ball.rebound();
              __ball.update(dt);
            }
            else if (ballYToHit <= -ballBoundingRect.y2 || ballYToHit >=  ballBoundingRect.y2) {  // if the ball's position is out of it's y-bound (for it's bounding rectangle) somebody lost
             if (player === __thePlayer) {
              __playerWon(__players[1]); // the computer won - booooo....
             }
             else {
               __playerWon(__thePlayer); // we won!!! (! boooooo....)
             }

             //console.log('loser!');
             return;
            }

          }


        }





        // draw the game objects...
        __map.draw();
        __ball.draw();

        for (count = 0; count < __players.length; count++) {
          player = __players[count];
          player.draw();
        }

        __lastDrawTime = tickTime;

        // stop calling the browser's animate when ready callback function when the modal has closed
        if (__isAppRunning) {
          requestAnimationFrame(__tick);
        }
    }

    this.start = __initGame;

    return this;
  }
  // End of Game Class



     // start this demo up!
  _init();


  	}