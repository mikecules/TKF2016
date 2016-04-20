(function() {
// turn on JavaScript strictness so we can catch error's easier
  'use strict';

// Declare vendor-libs level module used by angularJS
  angular.module('app', [])
      .controller('mainCtrl', ['$scope', 'webGLUtilities', 'webGLDrawUtilities', function($scope, webGLUtilities, webGLDrawUtilities) {

        webGLUtilities.initCanvasModalWidget('canvas-modal-widget');

        var canvasModalWidget = webGLUtilities.getCanvasModalWidget();

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Demo 1: Draws points at various extremes of the x, y, z axis which ranges from -1 to 1
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        function drawPointExample() {

          // get the gl context from our modal widget
          var gl = canvasModalWidget.getGLContext();

          // if we couldn't get the WebGL context abort!
          if (!gl) {
            throw new Error('Could not run drawPointExample() WebGL Demo!');
          }

          // get the shaders and compile them - the resultant will be a program that is automatically joined to the gl context in the background
          var program = canvasModalWidget.setGLVertexAndFragmentShaders('#v-shader-demo1', '#f-shader-demo1');

          // create vertex data and the buffer then bind them!
          var vertices = new Float32Array([
            0.0, 0.0, 0.0, // x , y, z coordinates for each of our points in 3D space
            1.0, 0.0, 0.0,
            0.0, 1.0, 0.0,
            1.0, 1.0, 0.0,
            -1.0, 0.0, 0.0,
            -1.0, -1.0, 0.0,
            -1.0, 1.0, 0.0,
            1.0, -1.0, 0.0,
            0.0, -1.0, 0.0
          ]);

          var NUM_OF_COORDS = 3,                  // x, y, z per point
              vertexBuffer = gl.createBuffer();   // create the buffer from the WebGL Context

          gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // let WebGL know we are selecting this buffer
          gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW); // now write our data to the selected buffer

          // get the location of the a_Position attribute in the vertex shader
          var a_Position = gl.getAttribLocation(program, 'a_Position');

          // Give WebGL some info about the data we are assigning to the position variable
          /*
           void glVertexAttribPointer( GLuint index,
           GLint size,
           GLenum type,
           GLboolean normalized,
           GLsizei stride,
           const GLvoid * pointer);
           see https://www.khronos.org/opengles/sdk/docs/man/xhtml/glVertexAttribPointer.xml
           */
          gl.vertexAttribPointer(a_Position, NUM_OF_COORDS, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(a_Position); // tell WebGL we want to enable this vertex shader variable for this buffer

          // Set clear color to black, fully opaque
          gl.clearColor(0.0, 0.0, 0.0, 1.0);

          // Clear the color buffer.
          gl.clear(gl.COLOR_BUFFER_BIT);

          // Draw the points
          /*
           void glDrawArrays(  GLenum mode,
           GLint first,
           GLsizei count);

           see https://www.khronos.org/opengles/sdk/docs/man/xhtml/glDrawArrays.xml
           */
          gl.drawArrays(gl.POINTS, 0, vertices.length / NUM_OF_COORDS);

        }

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Demo 2: Draws freeform points recorded as we hold down the "click" mouse button
        // the points will be drawn in blue
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        function drawSimpleShapeWithMouseExample() {

          // get the gl context from our modal widget
          var gl = canvasModalWidget.getGLContext(),
              RESIZE_EVENT_NAME = 'resize.demo2', // make this a constant we want to know when the window is resizes
              _window = $(window); // lets cache a jQuery reference to the window

          // if we couldn't get the WebGL context abort!
          if (!gl) {
            throw new Error('Could not run drawPointExample() WebGL Demo!');
          }

          // this anonymous function is called when our modal is dismissed
          canvasModalWidget.onHide(function() {
            //console.log('Closed');
            // unbind our resize listener on modal close (clean-up)
            _window.unbind(RESIZE_EVENT_NAME);
          });

          // get the shaders and compile them - the resultant will be a program that is automatically joined to the gl context in the background
          var program = canvasModalWidget.setGLVertexAndFragmentShaders('#v-shader-demo1', '#f-shader-demo1');

          // this array stores all of our points that we will be drawing
          var freeFormPoints = [];

          // we only care to record the x and y points since we don't care about the z-axis at this point
          var NUM_OF_COORDS = 2,
              vertexBuffer = gl.createBuffer(), // create the buffer
              _canvasRect = null; // we will cache the canvas rectangle object for perfomance reasons

          // tell WebGL that we want to use the vertex buffer
          gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

          // give WebGL some information about the data we are storing in the buffer
          gl.vertexAttribPointer(a_Position, NUM_OF_COORDS, gl.FLOAT, false, 0, 0);

          // get the location of the a_Position attribute in the vertex shader
          var a_Position = gl.getAttribLocation(program, 'a_Position');

          // we want to enable the position variable for use
          gl.enableVertexAttribArray(a_Position);

          // on window resize we want to get a new reference to the canvas rectangle object
          _window.on(RESIZE_EVENT_NAME, function() { /* console.log('window resized!'); */
            _canvasRect = null;
          })

          // this method clears our colour buffer and then draws our points
          function _draw() {
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(freeFormPoints), gl.STATIC_DRAW);
            gl.drawArrays(gl.POINTS, 0, freeFormPoints.length / 2);
          }

          // _bindMouseEvents() contains the logic to toronto-map browser x, y coordinates to WebGL
          // coordinetes - remember that WebGL uses -1 <= x <= 1, -1 <= y <= 1, -1 <= z <= 1
          // coordinate space.
          function _bindMouseEvents() {
            var __startTracking = false,
                __glCanvas = canvasModalWidget.getGLCanvasEl(),
                __midCanvasHeight = __glCanvas.height() / 2,
                __midCanvasWidth = __glCanvas.width() / 2;

            function __captureMouseCoords(e) {
              var x = e.clientX, // x coordinate of a mouse pointer
                  y = e.clientY; // y coordinate of a mouse pointer

              // grab the cached canvas rectangle or query the event object
              // for a new one
              _canvasRect = _canvasRect || e.target.getBoundingClientRect();

              // make
              x = ((x - _canvasRect.left) - __midCanvasWidth) / __midCanvasWidth;
              y = (__midCanvasHeight - (y - _canvasRect.top)) / __midCanvasHeight;

              // store our transformed points in the array
              freeFormPoints.push(x), freeFormPoints.push(y);
              //console.log(freeFormPoints.length/2)

              _draw();
              //console.log(e);
            }

            // bind our mouse listener that will capture our x,y coordinates
            __glCanvas
                .on('mousedown', function(event) {
                  __startTracking = true;
                  event.stopPropagation();

                  __captureMouseCoords(event);

                })
                .on('mousemove', function(event) {

                  if (!__startTracking) {
                    return;
                  }

                  __captureMouseCoords(event);

                })
                .on('mouseup', function(e) {
                  __startTracking = false;
                });

          }

          // _init() is our start function
          function _init() {
            // Set clear color to black, fully opaque
            gl.clearColor(0.0, 0.0, 0.0, 1.0);

            // Clear the color buffer.
            gl.clear(gl.COLOR_BUFFER_BIT);

            _bindMouseEvents();
          }

          // start this demo
          _init();

        }

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Demo 3: Draws a triangle and then uses tranformations to copy the same triangle at 2 other locations
        // with 3 other drawing modes.
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        function shapesExample() {

          // get the gl context from our modal widget
          var gl = canvasModalWidget.getGLContext();

          if (!gl) {
            throw new Error('Could not run shapesExample() WebGL Demo!');
          }

          // get the shaders and compile them - the resultant will be a program that is automatically joined to the gl context in the background
          var program = canvasModalWidget.setGLVertexAndFragmentShaders('#v-shader-demo3', '#f-shader-demo3');

          // create vertex data and the buffer then bind them!
          var vertices = new Float32Array([
            -0.5, 0.0, 0.0, // x , y, z coordinatates
            0.5, 0.0, 0.0,
            0.0, 1.0, 0.0
          ]);

          var NUM_OF_COORDS = 3,
              vertexBuffer = gl.createBuffer();

          gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

          // get the location of the a_Position attribute in the vertex shader
          var a_Position = gl.getAttribLocation(program, 'a_Position');
          var u_Translation = gl.getUniformLocation(program, 'u_Translation');
          var u_FragColour = gl.getUniformLocation(program, 'u_FragColour');

          // Assign the pointer
          gl.vertexAttribPointer(a_Position, NUM_OF_COORDS, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(a_Position);

          // Set clear color to black, fully opaque
          gl.clearColor(0.0, 0.0, 0.0, 1.0);

          // Clear the color buffer.
          gl.clear(gl.COLOR_BUFFER_BIT);

          // here we have our translation coordinates, our draw mode and colours all in one data structure
          // a JavaScript object.
          var translations = [
            {x: 0, y: 0, z: 0, drawMode: gl.TRIANGLES, colour: [1.0, 0.0, 0.0, 1.0]},
            {x: -0.5, y: -1.0, z: 0, drawMode: gl.LINE_LOOP, colour: [0.0, 1.0, 0.0, 1.0]},
            {x: 0.5, y: -1.0, z: 0, drawMode: gl.TRIANGLE_STRIP, colour: [0.0, 0.0, 1.0, 1.0]}
          ];

          for (var i = 0; i < translations.length; i++) {
            var t = translations[i],
                RGBComponent = t.colour;

            // we are using the uniform shader variable type to apply the transformations to
            // each of the vertices.
            gl.uniform4f(u_Translation, t.x, t.y, t.z, 0.0);

            // we want a custom colour so lets apply the (r,g,b,a) colour components to the
            // fragment colour variable we are using to colour our triangles
            gl.uniform4f(u_FragColour, RGBComponent[0], RGBComponent[1], RGBComponent[2], 1.0);

            // Draw the points
            gl.drawArrays(t.drawMode, 0, 3);
          }

        }

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Demo 4: Shows how we can use the fragment shaders Varying variable to colour our shapes using colour
        // interpolation.
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        function shapesFragmentVaryingExample() {
          // get the gl context from our modal widget
          var gl = canvasModalWidget.getGLContext();

          if (!gl) {
            throw new Error('Could not run shapesExample() WebGL Demo!');
          }

          // get the shaders and compile them - the resultant will be a program that is automatically joined to the gl context in the background
          var program = canvasModalWidget.setGLVertexAndFragmentShaders('#v-shader-demo4', '#f-shader-demo4');

          // create vertex data and the buffer then bind them!
          var verticesWithColours = new Float32Array([
            -1.0, -1.0, 0.0, /* Colors (RGB) --> */ 1.0, 0.0, 0.0, // x , y, z, r, g, b, a coordinatates
            1.0, -1.0, 0.0, /* Colors (RGB) --> */ 0.0, 1.0, 0.0,
            0.0, 1.0, 0.0, /* Colors (RGB) --> */ 0.0, 0.0, 1.0
          ]);

          var NUM_OF_COORDS = 3,
              vertexBuffer = gl.createBuffer();

          // create vertex buffer
          gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, verticesWithColours, gl.STATIC_DRAW);

          // create colour buffer
          var vertexColourBuffer = gl.createBuffer();
          gl.bufferData(gl.ARRAY_BUFFER, verticesWithColours, gl.STATIC_DRAW);

          // get the location of the a_Position attribute in the vertex shader
          var a_Position = gl.getAttribLocation(program, 'a_Position');
          var a_Colour = gl.getAttribLocation(program, 'a_Colour');

          var SIZE_OF_ELEMENT = verticesWithColours.BYTES_PER_ELEMENT;

          // Assign the pointer
          gl.vertexAttribPointer(a_Position, NUM_OF_COORDS, gl.FLOAT, false, SIZE_OF_ELEMENT * 6, 0);
          gl.enableVertexAttribArray(a_Position);

          gl.vertexAttribPointer(a_Colour, NUM_OF_COORDS, gl.FLOAT, false, SIZE_OF_ELEMENT * 6, SIZE_OF_ELEMENT * NUM_OF_COORDS);
          gl.enableVertexAttribArray(a_Colour);

          // Set clear color to black, fully opaque
          gl.clearColor(0.0, 0.0, 0.0, 1.0);

          // Clear the color buffer.
          gl.clear(gl.COLOR_BUFFER_BIT);

          // Draw the points
          gl.drawArrays(gl.TRIANGLES, 0, NUM_OF_COORDS);

        }

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Demo 5: Shows a sphere and rectangle being animated in 3D space!
        // we reuse this function to show what orthographic looks like vs perspective projection
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        function animating3DPrimativesExample(doOrthoProjectionInstead) {

          // get the gl context from our modal widget
          var _gl = null,
              _glProgram = null,
              _sphere = null,
              _quad = null,
              _lastDrawTime = 0,
              _isAppRunning = true,
              _shouldProjectOrtho = doOrthoProjectionInstead || false;

          ///////////////////////////////////////////////////////////////////////////////////////////////////
          //	_Sphere(radius) Constructor method is used to represent and Sphere with a radius
          //  this sphere can draw itself and adjust its orientation on the canvas via the accessor methods.
          ///////////////////////////////////////////////////////////////////////////////////////////////////
          function _Sphere(radius) {
            var __sphereData = null,
                __sphereVertexPositionBuffer = null,
                __sphereVertexIndexBuffer = null,

                __colour = {r: 0.8, g: 0.8, b: 0.8, a: 1.0},
                __radius = radius || 1.0,
                __modelMatrix = mat4.create(), // we are using the glMatrix Library to help us with our matrix math
                __rotationMatrix = mat4.create(),
                __translationMatrix = mat4.create(),
                __scaleMatrix = mat4.create();

            function __init() {
              __sphereData = webGLDrawUtilities.createSphereVertexData(__radius);

              // create the buffer for vertex positions and assign it to that buffer to use for later
              __sphereVertexPositionBuffer = _gl.createBuffer();
              __sphereVertexPositionBuffer.itemSize = 3;
              __sphereVertexPositionBuffer.numItems = __sphereData.vertexPositionData.length / __sphereVertexPositionBuffer.itemSize;
              __sphereVertexPositionBuffer.items = new Float32Array(__sphereData.vertexPositionData);

              // for efficiency bind the buffer and preload the data
              _gl.bindBuffer(_gl.ARRAY_BUFFER, __sphereVertexPositionBuffer);
              _gl.bufferData(_gl.ARRAY_BUFFER, __sphereVertexPositionBuffer.items, _gl.STATIC_DRAW);

              // create the buffer for vertex positions indexes and assign it to that buffer to use for later
              __sphereVertexIndexBuffer = _gl.createBuffer();
              __sphereVertexIndexBuffer.itemSize = 1;
              __sphereVertexIndexBuffer.numItems = __sphereData.vertexIndexData.length;
              __sphereVertexIndexBuffer.items = new Uint16Array(__sphereData.vertexIndexData);

              // for efficiency bind the buffer and preload the data
              _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, __sphereVertexIndexBuffer);
              _gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER, __sphereVertexIndexBuffer.items, _gl.STATIC_DRAW);
            }

            // __draw() does the drawing of the sphere - we use some new webGL functions in this method
            function __draw() {

              // multiple the appropriate matrices using glMatrix functions
              // calculate the Model Matrix
              mat4.multiply(__modelMatrix, __translationMatrix, __rotationMatrix);
              mat4.multiply(__modelMatrix, __modelMatrix, __scaleMatrix);

              /*
               void glUniform4fv(  GLint location,
               GLsizei count,
               const GLfloat *value);

               see https://www.khronos.org/opengles/sdk/docs/man/xhtml/glUniform.xml
               */

              _gl.uniformMatrix4fv(_glProgram.customAttribs.u_ModelMatrixRef, false, __modelMatrix);

              _gl.bindBuffer(_gl.ARRAY_BUFFER, __sphereVertexPositionBuffer);
              _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, __sphereVertexIndexBuffer);

              _gl.vertexAttribPointer(_glProgram.customAttribs.a_PositionRef, __sphereVertexPositionBuffer.itemSize, _gl.FLOAT, false, 0, 0);
              _gl.enableVertexAttribArray(_glProgram.customAttribs.a_PositionRef);

              /*

               void glUniform4f(   GLint location,
               GLfloat v0,
               GLfloat v1,
               GLfloat v2,
               GLfloat v3);

               see https://www.khronos.org/opengles/sdk/docs/man/xhtml/glUniform.xml

               */
              _gl.uniform4f(_glProgram.customAttribs.u_FragColourRef, __colour.r, __colour.g, __colour.b, __colour.a);

              _gl.drawElements(_gl.LINE_LOOP, __sphereVertexIndexBuffer.numItems, _gl.UNSIGNED_SHORT, 0);

            }

            // rotate the sphere by (x, y, z) radians
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

              return this;

            }

            // scale the sphere
            function __scale(s) {
              if (typeof s === 'number') {
                mat4.scale(__scaleMatrix, __scaleMatrix, vec3.fromValues(s, s, s));
              }

              return this;
            }

            // translate the sphere
            function __translate(x, y, z) {

              mat4.translate(__translationMatrix, __translationMatrix, vec3.fromValues(x, y, z));

              return this;
            }

            __init();

            this.rotateOnAxisByDegrees = __rotateOnAxisByDegrees;

            this.draw = __draw;

            this.scale = __scale;

            this.translate = __translate;

            this.setColour = function(r, g, b, a) {
              __colour.r = r;
              __colour.g = g;
              __colour.b = b;
              __colour.a = a;
            };

            this.getRadius = function() {
              return __radius;
            };

            return this;
          }

          ////////////////////////////////////////////////////////////////////////////////////////////////////////////
          //	_Quad(x, y, z) Constructor method is used to represent and Quadrilateral (rectangle) with
          //  width, height and depth (x, y ,z) dimensions respectively.
          //  This quadrilateral can draw itself and adjust its orientation on the canvas via the accessor methods.
          //  This is pretty much the same code as the sphere Constructor so we could optimize this class further
          //  by utilizing Prototypes...
          ////////////////////////////////////////////////////////////////////////////////////////////////////////////
          function _Quad(x, y, z) {

            var __quadData = null,
                __quadVertexPositionBuffer = null,
                __quadVertexIndexBuffer = null,
                __colour = {r: 1.0, g: 0.0, b: 1.0, a: 1.0},

                __modelMatrix = mat4.create(),
                __rotationMatrix = mat4.create(),
                __translationMatrix = mat4.create(),
                __scaleMatrix = mat4.create();

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

            }

            function __draw() {
              mat4.multiply(__modelMatrix, __translationMatrix, __rotationMatrix);
              mat4.multiply(__modelMatrix, __modelMatrix, __scaleMatrix);

              _gl.uniformMatrix4fv(_glProgram.customAttribs.u_ModelMatrixRef, false, __modelMatrix);

              _gl.bindBuffer(_gl.ARRAY_BUFFER, __quadVertexPositionBuffer);
              _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, __quadVertexIndexBuffer);

              _gl.vertexAttribPointer(_glProgram.customAttribs.a_PositionRef, __quadVertexPositionBuffer.itemSize, _gl.FLOAT, false, 0, 0);
              _gl.enableVertexAttribArray(_glProgram.customAttribs.a_PositionRef);

              _gl.uniform4f(_glProgram.customAttribs.u_FragColourRef, __colour.r, __colour.g, __colour.b, __colour.a);

              _gl.drawElements(_gl.LINE_LOOP, __quadVertexIndexBuffer.numItems, _gl.UNSIGNED_SHORT, 0);

            }

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

              return this;

            }

            function __scale(s) {
              if (typeof s === 'number') {
                mat4.scale(__scaleMatrix, __scaleMatrix, vec3.fromValues(s, s, s));
              }

              return this;
            }

            function __translate(x, y, z) {

              mat4.translate(__translationMatrix, __translationMatrix, vec3.fromValues(x, y, z));

              return this;
            }

            __init();

            this.rotateOnAxisByDegrees = __rotateOnAxisByDegrees;

            this.draw = __draw;

            this.scale = __scale;

            this.translate = __translate;

            this.setColour = function(r, g, b, a) {
              __colour.r = r;
              __colour.g = g;
              __colour.b = b;
              __colour.a = a;
            };

            return this;

          }

          function _init() {

            var glCanvas = webGLUtilities;

            _gl = canvasModalWidget.getGLContext();

            if (!_gl) {
              throw new Error('Could not run animating3DPrimativesExample() WebGL Demo!');
            }

            // in this case when we dismiss the modal stop calling the _tick function
            canvasModalWidget.onHide(function() {
              _isAppRunning = false;
              //console.log('cancel request animation');
            });

            // Set clear color to black, fully opaque
            _gl.clearColor(0.0, 0.0, 0.0, 1.0);

            // dealing with 3D space geometry so make sure this feature is enabled
            _gl.enable(_gl.DEPTH_TEST);

            // get the shaders and compile them - the resultant will be a program that is automatically joined to the gl context in the background
            _glProgram = canvasModalWidget.setGLVertexAndFragmentShaders('#v-shader-demo5', '#f-shader-demo5');

            // we inject this property so we can reference the appropriate data 
            // throughout our application.
            _glProgram.customAttribs = {};

            // Get the storage locations of all the customizable shader variables
            _glProgram.customAttribs.a_PositionRef = _gl.getAttribLocation(_glProgram, 'a_Position'),
                _glProgram.customAttribs.u_FragColourRef = _gl.getUniformLocation(_glProgram, 'u_FragColour'),
                _glProgram.customAttribs.u_ViewMatrixRef = _gl.getUniformLocation(_glProgram, 'u_ViewMatrix'),
                _glProgram.customAttribs.u_ModelMatrixRef = _gl.getUniformLocation(_glProgram, 'u_ModelMatrix'),
                _glProgram.customAttribs.u_PerspectiveRef = _gl.getUniformLocation(_glProgram, 'u_PerspectiveMatrix');

            var perspectiveMatrix = mat4.create(), // get the identity matrix
                viewMatrix = mat4.create(),
                modelMatrix = mat4.create(),
                viewportAspectRatio = canvasModalWidget.getGLViewportAspectRatio();

            if (_shouldProjectOrtho === true) {
              /*
               mat4.ortho(out, left, right, bottom, top, near, far)
               Generates a orthogonal projection matrix with the given bounds
               from: from: http://glmatrix.net/docs/2.2.0/symbols/mat4.html
               */
              mat4.ortho(perspectiveMatrix, -viewportAspectRatio, viewportAspectRatio, -viewportAspectRatio, viewportAspectRatio, 1, 1000);
            }
            else {
              /*
               mat4.perspective(out, fovy, aspect, near, far)
               Generates a perspective projection matrix with the given bounds
               from: http://glmatrix.net/docs/2.2.0/symbols/mat4.html
               */
              mat4.perspective(perspectiveMatrix, glMatrix.toRadian(45.0), viewportAspectRatio, 1, 1000);
            }

            _glProgram.customAttribs.perspectiveMatrix = perspectiveMatrix;

            /*
             {mat4} mat4.lookAt(out, eye, center, up)
             Generates a look-at matrix with the given eye position, focal point, and up axis
             from: http://glmatrix.net/docs/2.2.0/symbols/mat4.html
             */
            mat4.lookAt(viewMatrix, vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, -50), vec3.fromValues(0, 1, 0));
            _glProgram.customAttribs.viewMatrix = viewMatrix;

            _glProgram.customAttribs.modelMatrix = modelMatrix;

            // we set our uniform View and Perspective Matrices the multiplication of matrices happens in the vertex shader
            // new vertex position = P * V * M * (original vertex position coordinates)
            _gl.uniformMatrix4fv(_glProgram.customAttribs.u_ViewMatrixRef, false, _glProgram.customAttribs.viewMatrix);
            _gl.uniformMatrix4fv(_glProgram.customAttribs.u_PerspectiveRef, false, _glProgram.customAttribs.perspectiveMatrix);

            // create some primitives that can keep track of their own orientation and draw themselves
            _sphere = new _Sphere();
            _sphere
                .translate(-1.6, 0, 0);

            _quad = new _Quad(2, 0.5, 0.5);
            _quad
                .translate(0, 0, 2)
                .scale(0.5);

            // start animating the primitives
            _tick();

          }

          // we use these variables to do some arbitrary movements
          var _frameCount = 0,
              _xInc = 0.01,
              _yInc = 0.001,
              _zInc = 0.005;

          function _tick() {

            // Clear the color and depth buffer because now we are dealing with perspective and camera space.
            // and we want everything to look natural...
            _gl.clear(_gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT);

            // show some arbitrary movement along 3D space and do some rotations while we are at it
            _sphere
                .rotateOnAxisByDegrees(1, 1, 0)
                .translate(_xInc, _yInc, _zInc)
                .draw();

            _quad
                .rotateOnAxisByDegrees(-1, -1, 0)
                .draw();

            // counter used to create a pattern for the primitives to move and rotate along the screen
            _frameCount++;

            // reverse the directions when our frames drawn is least 220
            if (_frameCount >= 220) {
              _xInc = -_xInc;
              _yInc = -_yInc;
              _zInc = -_zInc;
              _frameCount = 0;
            }

            // stop calling the browser's animate when ready callback function when the modal has closed
            if (_isAppRunning) {

              // special browser function that recalls this draw function when the browser is ready
              // to perform the draw - this usually happens no less than approx 16.66ms = 60 frames per second (FPS)
              requestAnimationFrame(_tick);
            }
          }

          // start this demo up!
          _init();

        }

        function animating3DPrimativesOrthoExample() {
          animating3DPrimativesExample(true);
        }

        //////////////////////////////////////////////////

        function lightingExample() {
          // given that the application logic is long we moved the code to lightingExample.js
          window.$demos.lightingExample(canvasModalWidget, webGLDrawUtilities);
        }

        function Pong() {
          // given that the application logic is long we moved the code to pong.js
          window.$demos.Pong(canvasModalWidget, webGLDrawUtilities);
        }

        ////////////////////////////////////////////////////
        // End of examples
        ////////////////////////////////////////////////////

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Demo metadata and functions to execute used by angularJS to execute the demos.
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        var _demos = [
          [
            {
              caption: '6.1: Draw Fixed Points',
              details: 'Draw a 30 pixel dimensioned point on all extremes of the WebGL Coordinate space.' +
              ' Please note that we are ignoring the z-axis at this point (it\'s all 2D).',
              appFn: drawPointExample,
              screenShotURL: 'styles/vendor-libs/images/demo1.png'
            },
            {
              caption: '6.2: Free Draw Example',
              details: 'Hold down the mouse button to draw.',
              appFn: drawSimpleShapeWithMouseExample,
              screenShotURL: 'styles/vendor-libs/images/demo2.png'
            }
          ],
          [
            {
              caption: '6.3: Draw Modes and Translations',
              details: 'Draw some triangles using different WebGL draw modes and do some uniform translations to position the ' +
              ' vertices of a single triangle\'s vertices into 3 separate locations in space.',
              appFn: shapesExample,
              screenShotURL: 'styles/vendor-libs/images/demo3.png'
            },
            {
              caption: '6.4: Fragment Shader Interpolation',
              details: 'Using the Fragment shader\'s colour interpolation abilities we render a triangle.',
              appFn: shapesFragmentVaryingExample,
              screenShotURL: 'styles/vendor-libs/images/demo4.png'
            }
          ],
          [
            {
              caption: '6.5: Animation of 3D Primitives',
              details: 'Here we finally show you some 3D primitive models moving around in 3D-space using Perspective Projection.',
              appFn: animating3DPrimativesExample,
              screenShotURL: 'styles/vendor-libs/images/demo5.png'
            },
            {
              caption: '6.6: Animation of 3D Primitives (V2)',
              details: '<strong>Version 2</strong>: 3D primitive models moving around in 3D-space using Orthographic Projection. ' +
              'Notice how the objects appear to have lost their appearance of depth when compared against our previous version ' +
              'which uses Perspective Projection.',
              appFn: animating3DPrimativesOrthoExample,
              screenShotURL: 'styles/vendor-libs/images/demo5v2.png'
            }

          ],
          [
            {
              caption: '6.7: Lighting Example',
              details: 'An ambient and directional lighting example. The directional lighting is rotating around the ' +
              ' Y and Z axis as the 3D primitives move around in virtual 3D space.',
              appFn: lightingExample,
              screenShotURL: 'styles/vendor-libs/images/demo6.png'
            },
            {
              caption: '6.8: PongGL!',
              details: '<strong>Instructions</strong>: <ul>' +
              '<li>Press &quot;<strong>Space Bar</strong>&quot; to pause the game.</li>' +
              '<li>The &quot;<strong>left</strong>&quot; and &quot;<strong>right</strong>&quot; arrow keys to move your player.</li>' +
              '<li>&quot;<strong>w</strong>&quot;, &quot;<strong>s</strong>&quot; keys to rotate the camera on the X-Axis (Up and Down)</li>' +
              '<li>&quot;<strong>a</strong>&quot;, &quot;<strong>d</strong>&quot; keys to rotate the camera on the Y-Axis (Left and Right)</li>' +
              '<li>&quot;<strong>1</strong>&quot;, &quot;<strong>2</strong>&quot; numeric keys to move the camera on the Z-Axis (In and Out)</li>' +
              '</ul>',
              appFn: Pong,
              screenShotURL: 'styles/vendor-libs/images/demo7.png'
            }
          ]

        ];

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // STUDENT EXERCISES!!
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Now you can play around with the code in your own area - feel free to fill in these functions and remember to
        // uncomment the _studentDemos array entries below when you are ready to test your demos.
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        function yourDemoExample1() {
          alert('hello 3D world one!');
        }

        function yourDemoExample2() {
          alert('hello 3D world two!');
        }

        ////////////////////////////////////////////////////////////////////////////////////////////////////
        // STUDENT EXERCISES!!
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        // The data structure used here is exactly the same as the _demos array above so you can keep adding to
        // this array as you perform your experiments.
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        var _studentDemos = [
          /*

           [
           {
           caption: 'Your Demo Example 1', // UNCOMMENT these entries to start exploring your own WegGL experiments using this vendor-libs
           details:  'Some details about your demo 1',
           appFn: yourDemoExample1,
           screenShotURL: '#'
           },
           {
           caption: 'Your Demo Example 2',
           details: 'Some details about your demo 2',
           appFn: yourDemoExample2,
           screenShotURL: '#'
           }
           ],
           [
           {
           caption: 'Your Demo Example 3', // UNCOMMENT these entries to start exploring your own WegGL experiments using this vendor-libs
           details:  'Some details about your demo 3',
           appFn: function(){},
           screenShotURL: '#'
           },
           {
           caption: 'Your Demo Example 4',
           details: 'Some details about your demo 4',
           appFn: function(){},
           screenShotURL: '#'
           }
           ]
           */
        ];
        ////////////////////////////////////////////////////////////////////////////////////////////////////

        var _demosForType = {
          'rlo': _demos,
          'student': _studentDemos
        };

        // constructor method we use to loop through and execute the demos in index.html
        function _DemoRunner() {

          // used as a convenience array to look up demos by index
          var __demoRLOByOrderLookup = [];

          function __init() {
            for (var i = 0; i < _demos.length; i++) {
              for (var j = 0; j < _demos[i].length; j++) {
                __demoRLOByOrderLookup.push(_demos[i][j]);
              }
            }
          }

          __init();

          // public demo runner api
          this.run = function(demo) {

            var demoObject = demo;

            if (typeof demoObject === 'undefined') {
              throw new Error('Could not find the demo vendor-libs you were refering too...');
            }

            canvasModalWidget.setCaption(demoObject.caption || null)
                .setDetailText(demoObject.details || null)
                .show(demoObject.appFn);

          };

          this.getDemos = function(type, index, length) {

            var demos = _demosForType[type];

            if (typeof demos === 'undefined') {
              throw new Error('Could not find demos of type: ' + type);
            }

            if (typeof index === 'number') {
              if (index >= demos.length) {
                return null;
              }
              else {
                index = 0;
              }

              if (!length) {
                length = demos.length;
              }
            }

            return demos.slice(index, length);

          };

          this.getDemoByGroup = function(type, index) {
            var demos = _demosForType[type];

            if (typeof demos === 'undefined') {
              throw new Error('Could not find demos of type: ' + type);
            }

            return [demos[index]];
          };

          this.getRLODemoByOrderInList = function(order) {

            if (order >= __demoRLOByOrderLookup.length) {
              return null;
            }

            return __demoRLOByOrderLookup[order];
          };

          return this;
        }

        $scope.demoRunner = new _DemoRunner();

      }]);

})();