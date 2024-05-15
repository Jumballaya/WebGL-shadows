import { CameraFlyController } from "./CameraFlyController";
import { Inputs } from "./Inputs";
import { WebGL } from "./gl/WebGL";
import { load_data } from "./load_data";
import "./style.css";
import { vec2 } from "gl-matrix";

async function main() {
  const dimensions: vec2 = [1024, 786];
  const canvas = document.createElement("canvas");
  canvas.width = dimensions[0];
  canvas.height = dimensions[1];
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("webgl2");
  if (!ctx) throw new Error("could not create webgl2 context");

  ctx.getExtension("EXT_color_buffer_float");
  const webgl = new WebGL(ctx);
  webgl.enable("depth", "blend", "cull_face");

  const renderData = await load_data(webgl, dimensions);
  const { camera, meshes, light } = renderData;
  const inputs = new Inputs(canvas);
  const cameraController = new CameraFlyController(camera, inputs);

  light.position = [-3, 6, -3];
  light.lookAt([0, 0, 0]);

  // SHADOWS SETUP (fbo + texture)
  const depthMapFBO = ctx.createFramebuffer();
  if (!depthMapFBO) throw new Error("could not create depth map fbo");
  const shadowWidth = 1024;
  const shadowHeight = 1024;
  const depthMap = ctx.createTexture();
  if (!depthMap) throw new Error("could not create depth map texture");
  ctx.activeTexture(ctx.TEXTURE2);
  ctx.bindTexture(ctx.TEXTURE_2D, depthMap);
  ctx.texImage2D(
    ctx.TEXTURE_2D,
    0,
    ctx.DEPTH_COMPONENT24,
    shadowWidth,
    shadowHeight,
    0,
    ctx.DEPTH_COMPONENT,
    ctx.UNSIGNED_INT,
    null
  );
  ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
  ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
  ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
  ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
  ctx.bindFramebuffer(ctx.FRAMEBUFFER, depthMapFBO);
  ctx.framebufferTexture2D(
    ctx.FRAMEBUFFER,
    ctx.DEPTH_ATTACHMENT,
    ctx.TEXTURE_2D,
    depthMap,
    0
  );
  ctx.drawBuffers([ctx.NONE]);
  ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);

  ctx.clearColor(0, 0, 0, 1);

  let t = Date.now();
  const draw = () => {
    // CREATE DT
    const time = Date.now();
    const dt = (time - t) / 1000;
    t = time;

    // SHADOW PASS
    ctx.cullFace(ctx.FRONT);
    ctx.bindFramebuffer(ctx.FRAMEBUFFER, depthMapFBO);
    ctx.viewport(0, 0, shadowWidth, shadowHeight);
    ctx.clear(ctx.DEPTH_BUFFER_BIT);

    renderData.shaders.shadow.bind();
    light.updateShader(renderData.shaders.shadow, true);

    for (let mesh of meshes) {
      mesh.updateShader(renderData.shaders.shadow, false);
      mesh.vao.bind();
      webgl.drawArrays(mesh.vao.vertexCount, "triangles");
      mesh.vao.unbind();
    }
    ctx.cullFace(ctx.BACK);
    ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);

    // SCREEN PASS

    ctx.viewport(0, 0, dimensions[0], dimensions[1]);
    ctx.clear(ctx.DEPTH_BUFFER_BIT | ctx.COLOR_BUFFER_BIT);

    renderData.shaders.phong.bind();
    camera.updateShader(renderData.shaders.phong);
    light.updateShader(renderData.shaders.phong);

    ctx.activeTexture(ctx.TEXTURE0);
    ctx.bindTexture(ctx.TEXTURE_2D, depthMap);
    renderData.shaders.phong.uniform("u_tex_depth", {
      type: "texture",
      value: 0,
    });

    for (let mesh of meshes) {
      mesh.updateShader(renderData.shaders.phong);
      mesh.vao.bind();
      webgl.drawArrays(mesh.vao.vertexCount, "triangles");
      mesh.vao.unbind();
    }

    renderData.shaders.phong.unbind();

    // UPDATE CAMERA CONTROLELR
    cameraController.update(dt);

    // Update light
    light.position = [Math.cos(t / 500) * 6, 6, Math.sin(t / 500) * 6];
    light.lookAt([0, 0, 0]);

    requestAnimationFrame(draw);
  };
  draw();
}
main();
