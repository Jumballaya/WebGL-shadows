import { CameraFlyController } from "./CameraFlyController";
import { Inputs } from "./Inputs";
import { load_data } from "./load_data";
import { Canvas } from "./renderer/Canvas";
import { Renderer } from "./renderer/Renderer";
import "./style.css";
import { vec2 } from "gl-matrix";

async function main() {
  const dimensions: vec2 = [1024, 786];
  const canvas = new Canvas(dimensions);

  const renderData = await load_data(canvas.webgl, dimensions);
  const { camera, meshes, lights, skybox } = renderData;
  const inputs = new Inputs(canvas.element);
  const cameraController = new CameraFlyController(camera, inputs);

  const renderer = new Renderer(
    canvas.webgl,
    dimensions,
    renderData.shaders.phong
  );

  const start = meshes[0].transform.translation;
  const start2 = meshes[1].transform.translation;

  let t = Date.now();
  const draw = () => {
    // CREATE DT
    const time = Date.now();
    const dt = (time - t) / 1000;
    t = time;

    renderer.render({
      camera,
      meshes,
      lights,
      skybox,
    });

    // UPDATE CAMERA CONTROLELR
    cameraController.update(dt);

    // Move stuff
    meshes[0].transform.translation = [
      start[0],
      start[1],
      Math.cos(t / 500) * 8,
    ];

    meshes[1].transform.translation = [
      Math.cos(t / 500) * 8,
      start2[1],
      start2[2],
    ];

    requestAnimationFrame(draw);
  };
  draw();
}
main();
