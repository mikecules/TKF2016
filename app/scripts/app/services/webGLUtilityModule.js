'use strict';

/*
  This file provides the platform logic for the creation of our modal window as well as some utility draw
  functions that will calculate the vertices needed to draw our 3D rectangles and spheres.
  @author: Michael Moncada <michael.moncada@gmail.com>
*/

angular.module('webGLUtilityModule', [])
.service('webGLDrawUtilities', [function() { // angularJS 3D Primitives Service we inject into our demo examples to draw our shapes

  // generate 3D-Cube vertices and normals.
  this.createCubeVertexData = function(scaleX, scaleY, scaleZ) {
    scaleX = scaleX || 1.0,
    scaleY = scaleY || 1.0,
    scaleZ = scaleZ || 1.0;

    var vertexPositionData = [
      // Front face
      -1.0 * scaleX, -1.0 * scaleY, 1.0 * scaleZ,
       1.0 * scaleX, -1.0 * scaleY,  1.0 * scaleZ,
       1.0 * scaleX,  1.0 * scaleY,  1.0 * scaleZ,
      -1.0 * scaleX,  1.0 * scaleY,  1.0 * scaleZ,

      // Back face
      -1.0 * scaleX, -1.0 * scaleY, -1.0 * scaleZ,
      -1.0 * scaleX,  1.0 * scaleY, -1.0 * scaleZ,
       1.0 * scaleX,  1.0 * scaleY, -1.0 * scaleZ,
       1.0 * scaleX, -1.0 * scaleY, -1.0 * scaleZ,

      // Top face
      -1.0 * scaleX,  1.0 * scaleY, -1.0 * scaleZ,
      -1.0 * scaleX,  1.0 * scaleY,  1.0 * scaleZ,
       1.0 * scaleX,  1.0 * scaleY,  1.0 * scaleZ,
       1.0 * scaleX,  1.0 * scaleY, -1.0 * scaleZ,

      // Bottom face
      -1.0 * scaleX, -1.0 * scaleY, -1.0 * scaleZ,
       1.0 * scaleX, -1.0 * scaleY, -1.0 * scaleZ,
       1.0 * scaleX, -1.0 * scaleY,  1.0 * scaleZ,
      -1.0 * scaleX, -1.0 * scaleY,  1.0 * scaleZ,

      // Right face
       1.0 * scaleX, -1.0 * scaleY, -1.0 * scaleZ,
       1.0 * scaleX,  1.0 * scaleY, -1.0 * scaleZ,
       1.0 * scaleX,  1.0 * scaleY,  1.0 * scaleZ,
       1.0 * scaleX, -1.0 * scaleY,  1.0 * scaleZ,

      // Left face
      -1.0 * scaleX, -1.0 * scaleY, -1.0 * scaleZ,
      -1.0 * scaleX, -1.0 * scaleY,  1.0 * scaleZ,
      -1.0 * scaleX,  1.0 * scaleY,  1.0 * scaleZ,
      -1.0 * scaleX,  1.0 * scaleY, -1.0 * scaleZ,
    ];

    var indexData = [
      // Front face
      0, 1, 2,
      0, 2, 3,

      // Back face
      4, 5, 6,
      4, 6, 7,

      // Top face
      8, 9, 10,
      8, 10, 11,

      // Bottom face
      12, 13, 14,
      12, 14, 15,

      // Right face
      16, 17, 18,
      16, 18, 19,

      // Left face
      20, 21, 22,
      20, 22, 23
    ];

    var vertexNormals = [
      // Front face
       0.0,  0.0,  1.0,
       0.0,  0.0,  1.0,
       0.0,  0.0,  1.0,
       0.0,  0.0,  1.0,

      // Back face
       0.0,  0.0, -1.0,
       0.0,  0.0, -1.0,
       0.0,  0.0, -1.0,
       0.0,  0.0, -1.0,

      // Top face
       0.0,  1.0,  0.0,
       0.0,  1.0,  0.0,
       0.0,  1.0,  0.0,
       0.0,  1.0,  0.0,

      // Bottom face
       0.0, -1.0,  0.0,
       0.0, -1.0,  0.0,
       0.0, -1.0,  0.0,
       0.0, -1.0,  0.0,

      // Right face
       1.0,  0.0,  0.0,
       1.0,  0.0,  0.0,
       1.0,  0.0,  0.0,
       1.0,  0.0,  0.0,

      // Left face
      -1.0,  0.0,  0.0,
      -1.0,  0.0,  0.0,
      -1.0,  0.0,  0.0,
      -1.0,  0.0,  0.0,
    ];

     return {
      'vertexIndexData': indexData,
      'vertexPositionData': vertexPositionData,
      'vertexNormals': vertexNormals
    };


  }

  // generate Sphere vertices, normals and textures
  this.createSphereVertexData = function(r, latBands, longBands) {

    /* Algorithm accredited to "WebGL Lesson 11 – spheres, rotation matrices, and mouse events | Learning WebGL"
    from http://learningwebgl.com/blog/?p=1253, Retrieved: March 21, 2015 */
    var latitudeBands = latBands ? latBands : 30;
    var longitudeBands = longBands ? longBands : 30;
    var radius = r ? r : 1.0;

    var vertexPositionData = [];
    var vertexNormals = [];
    var textureCoordData = [];

    for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
      var theta = latNumber * Math.PI / latitudeBands;
      var sinTheta = Math.sin(theta);
      var cosTheta = Math.cos(theta);

      for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
        var phi = longNumber * 2 * Math.PI / longitudeBands;
        var sinPhi = Math.sin(phi);
        var cosPhi = Math.cos(phi);

        var x = cosPhi * sinTheta;
        var y = cosTheta;
        var z = sinPhi * sinTheta;
        var u = 1 - (longNumber / longitudeBands);
        var v = 1 - (latNumber / latitudeBands);

        vertexNormals.push(x);
        vertexNormals.push(y);
        vertexNormals.push(z);
        textureCoordData.push(u);
        textureCoordData.push(v);
        vertexPositionData.push(radius * x);
        vertexPositionData.push(radius * y);
        vertexPositionData.push(radius * z);
      }
    }

    var indexData = [];

    /* first ----- first + 1
        |         /|
        |        / |
        |       /  |
        |      /   |
        |     /    |
        |    /     |
        |   /      |
        |  /       |
        | /        |
        |/         |
      second ----- second + 1
    */
    for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
      for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
        var first = (latNumber * (longitudeBands + 1)) + longNumber;
        var second = first + longitudeBands + 1;
        indexData.push(first);
        indexData.push(second);
        indexData.push(first + 1);

        indexData.push(second);
        indexData.push(second + 1);
        indexData.push(first + 1);
      }
    }

    return {
      'vertexIndexData': indexData,
      'vertexPositionData': vertexPositionData,
      'vertexNormals': vertexNormals,
      'textureCoordData': textureCoordData
    };

  }

  return this;

}]);
