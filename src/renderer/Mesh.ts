import { vec3 } from "gl-matrix";
import { Shader } from "../gl/Shader";
import { VertexArray } from "../gl/VertexArray";
import { Transform } from "../math/Transform";
import { Material } from "./Material";

export class Mesh {
  public vao: VertexArray;
  public transform = new Transform();
  public material: Material;

  public color: vec3 = [1, 0.5, 0.31];

  constructor(vao: VertexArray, material: Material) {
    this.vao = vao;
    this.material = material;
  }

  public updateShader(shader: Shader, withMaterial = true) {
    shader.uniform("u_model_matrix", {
      type: "mat4",
      value: this.transform.matrix,
    });
    if (withMaterial) {
      this.material.diffuse.bind(1);
      shader.uniform("u_material.diffuse", {
        type: "texture",
        value: 1,
      });
      if (this.material.specular) {
        this.material.specular.bind(2);
        shader.uniform("u_material.specular", {
          type: "texture",
          value: 2,
        });
      } else {
        shader.uniform("u_material.specular", {
          type: "texture",
          value: 16,
        });
      }
      shader.uniform("u_material.shininess", {
        type: "float",
        value: this.material.shininess,
      });
      shader.uniform("u_material.albedoScale", {
        type: "float",
        value: this.material.albedoScale,
      });
    }
  }
}
