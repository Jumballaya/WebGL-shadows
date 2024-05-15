import { mat4, vec2, vec3 } from "gl-matrix";
import { Shader } from "../gl/Shader";
import { VertexArray } from "../gl/VertexArray";
import { WebGL } from "../gl/WebGL";
import { FrameBuffer } from "../gl/FrameBuffer";
import { Mesh } from "./Mesh";
import { Camera } from "./Camera";

export class Light {
  private webgl: WebGL;
  private fbo: FrameBuffer;
  private shadowShader: Shader;
  private shadowMapSize: vec2 = [1024, 1024];
  private helperShader: Shader;

  private _position: vec3 = [0, 0, 0];
  public direction: vec3 = [0, 0, 1];
  public color: vec3 = [1, 1, 1];
  public intensity = {
    ambient: 0.1,
    specular: 0.5,
  };

  public model = mat4.create();
  public view = mat4.create();
  public projection = mat4.create();

  public helper: VertexArray;

  constructor(
    webgl: WebGL,
    helper: VertexArray,
    shadowShader: Shader,
    helperShader: Shader
  ) {
    mat4.ortho(this.projection, -10, 10, -10, 10, 1, 30);
    this.helper = helper;
    this.webgl = webgl;
    this.shadowShader = shadowShader;
    this.helperShader = helperShader;

    this.fbo = webgl.createFrameBuffer();
    this.fbo.bind();
    this.fbo.attachment({
      type: "depth",
      size: [this.shadowMapSize[0], this.shadowMapSize[1]],
    });
    webgl.drawBuffers(this.fbo.getDrawBuffers());
    this.fbo.unbind();
  }

  public get position(): vec3 {
    return this._position;
  }

  public set position(v: vec3) {
    this._position = v;
    mat4.translate(this.model, mat4.create(), this.position);
    mat4.scale(this.model, this.model, [0.1, 0.1, 0.1]);
  }

  public lookAt(pos: vec3) {
    mat4.lookAt(this.view, this.position, pos, [0, 1, 0]);
  }

  public updateShader(shader: Shader, shadowPass = false) {
    if (shadowPass) {
      shader.uniform("u_view_matrix", {
        type: "mat4",
        value: this.view,
      });
      shader.uniform("u_projection_matrix", {
        type: "mat4",
        value: this.projection,
      });
      return;
    }
    shader.uniform("u_light_view_matrix", {
      type: "mat4",
      value: this.view,
    });
    shader.uniform("u_light_projection_matrix", {
      type: "mat4",
      value: this.projection,
    });
    shader.uniform("u_light.position", {
      type: "vec3",
      value: this.position,
    });
    shader.uniform("u_light.direction", {
      type: "vec3",
      value: this.direction,
    });
    shader.uniform("u_light.color", {
      type: "vec3",
      value: this.color,
    });
    shader.uniform("u_light.ambient", {
      type: "float",
      value: this.intensity.ambient,
    });
    shader.uniform("u_light.specular", {
      type: "float",
      value: this.intensity.specular,
    });
  }

  public generateShadowMap(meshes: Mesh[]) {
    this.webgl.cullFace("front");
    this.fbo.bind();
    this.webgl.viewport(0, 0, [this.shadowMapSize[0], this.shadowMapSize[1]]);
    this.webgl.clear("depth");

    this.shadowShader.bind();
    this.updateShader(this.shadowShader, true);

    for (let mesh of meshes) {
      mesh.updateShader(this.shadowShader, false);
      mesh.vao.bind();
      this.webgl.drawArrays(mesh.vao.vertexCount, "triangles");
      mesh.vao.unbind();
    }
    this.webgl.cullFace("back");
    this.fbo.unbind();
  }

  public getShadowMap() {
    return this.fbo.getDepthTexture();
  }

  public renderHelper(camera: Camera) {
    this.helperShader.bind();
    this.helperShader.uniform("u_model_matrix", {
      type: "mat4",
      value: this.model,
    });
    camera.updateShader(this.helperShader);
    this.helper.bind();
    this.webgl.drawArrays(this.helper.vertexCount, "triangles");
    this.helper.unbind();
    this.helperShader.unbind();
  }
}
