import { Shader } from "../gl/Shader";
import { WebGL } from "../gl/WebGL";
import { Camera } from "./Camera";
import { Light } from "./Light";
import { Mesh } from "./Mesh";
import { Skybox } from ".//Skybox";
import { vec2 } from "gl-matrix";

export type Scene = {
  meshes: Mesh[];
  lights: Light[];
  camera: Camera;
  skybox?: Skybox;
};

export class Renderer {
  private webgl: WebGL;
  public screenSize: vec2;

  private renderShader: Shader;

  constructor(webgl: WebGL, screenSize: vec2, renderShader: Shader) {
    this.webgl = webgl;
    this.screenSize = screenSize;
    this.renderShader = renderShader;
  }

  public render(scene: Scene) {
    for (const light of scene.lights) {
      light.generateShadowMap(scene.meshes);
    }

    this.webgl.viewport(0, 0, this.screenSize);
    this.webgl.clear("depth", "color");

    if (scene.skybox) {
      scene.skybox.draw(scene.camera);
    }

    this.renderScene(scene);
  }

  private renderScene(scene: Scene) {
    this.renderShader.bind();
    scene.camera.updateShader(this.renderShader);

    for (const light of scene.lights) {
      light.updateShader(this.renderShader);
      const depthTex = light.getShadowMap();
      if (depthTex) {
        depthTex.bind();
        this.renderShader.uniform("u_tex_depth", {
          type: "texture",
          value: depthTex.id,
        });
      }

      for (let mesh of scene.meshes) {
        mesh.updateShader(this.renderShader);
        mesh.vao.bind();
        this.webgl.drawArrays(mesh.vao.vertexCount, "triangles");
        mesh.vao.unbind();
      }
    }

    this.renderShader.unbind();
  }
}
