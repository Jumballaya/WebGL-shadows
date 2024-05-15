import { WebGL, loadImages } from "./gl/WebGL";

import bvert from "./shaders/phong/vertex.glsl?raw";
import bfrag from "./shaders/phong/fragment.glsl?raw";

import bavert from "./shaders/basic/vertex.glsl?raw";
import bafrag from "./shaders/basic/fragment.glsl?raw";

import lhvert from "./shaders/light_helper/vertex.glsl?raw";
import lhfrag from "./shaders/light_helper/fragment.glsl?raw";

import svert from "./shaders/screen/vertex.glsl?raw";
import sfrag from "./shaders/screen/fragment.glsl?raw";

import skyvert from "./shaders/skybox/vertex.glsl?raw";
import skyfrag from "./shaders/skybox/fragment.glsl?raw";

import { vec2 } from "gl-matrix";
import { createQuadGeometry } from "./math/geometry/quad";
import { createCubeGeometry } from "./math/geometry/cube";
import { PerspectiveCamera } from "./renderer/Camera";
import { Mesh } from "./renderer/Mesh";
import { Material } from "./renderer/Material";
import { Light } from "./renderer/Light";
import { createSkyboxGeometry } from "./math/geometry/skybox";
import { Skybox } from "./renderer/Skybox";

export async function load_data(webgl: WebGL, dimensions: vec2) {
  const camera = new PerspectiveCamera(70, dimensions[0] / dimensions[1]);
  camera.position = [0, 1.5, 0];
  const cubeVao = createCubeGeometry(webgl);
  const quadVao = createQuadGeometry(webgl);
  const skyboxVao = createSkyboxGeometry(webgl);

  const phongShader = webgl.createShader("phong", bvert, bfrag);
  const screenShader = webgl.createShader("screen", svert, sfrag);
  const shadowShader = webgl.createShader("shadow", bavert, bafrag);
  const skyboxShader = webgl.createShader("skybox", skyvert, skyfrag);
  const lightHelperShader = webgl.createShader("light_helper", lhvert, lhfrag);

  const cubeAlbedo = await webgl.loadTexture("textures/crate/albedo.png");
  const cubeSpecular = await webgl.loadTexture("textures/crate/specular.png");
  const cubeMat = new Material(cubeAlbedo, cubeSpecular);
  cubeMat.shininess = 128;
  const cube = new Mesh(cubeVao, cubeMat);
  cube.transform.translation = [0, 3, 0];
  const cube2 = new Mesh(cubeVao, cubeMat);
  cube2.transform.translation = [2, 1, 2];

  const floorTexture = await webgl.loadTexture("textures/wood_floor.png");
  const floorMat = new Material(floorTexture);
  floorMat.shininess = 64;
  floorMat.albedoScale = 6;
  const floor = new Mesh(quadVao, floorMat);
  floor.transform.scale = [30, 30, 1];
  floor.transform.rotation = [-Math.PI / 2, 0, 0];

  const light = new Light(webgl, cubeVao, shadowShader, lightHelperShader);
  light.intensity.ambient = 1;
  light.position = [-4, 9, -5.8];
  light.direction = [200, -500, 220];
  light.lookAt([0, 0, 0]);

  const skyboxTextures = await loadImages([
    "textures/skybox/right.jpg",
    "textures/skybox/left.jpg",
    "textures/skybox/bottom.jpg",
    "textures/skybox/top.jpg",
    "textures/skybox/front.jpg",
    "textures/skybox/back.jpg",
  ]);
  const skybox = new Skybox(webgl, skyboxTextures, skyboxShader, skyboxVao);

  return {
    camera,
    lights: [light],
    skybox,
    geometries: {
      cube: cubeVao,
      quad: quadVao,
      skybox: skyboxVao,
    },
    meshes: [cube, cube2, floor],
    shaders: {
      phong: phongShader,
      screen: screenShader,
      shadow: shadowShader,
      skybox: skyboxShader,
      lightHelper: lightHelperShader,
    },
  };
}
