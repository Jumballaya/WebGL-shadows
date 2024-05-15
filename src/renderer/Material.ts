import { Texture } from "../gl/Texture";

export class Material {
  public diffuse: Texture;
  public specular?: Texture;

  public shininess = 1;
  public albedoScale = 1;

  constructor(diffuse: Texture, specular?: Texture) {
    this.diffuse = diffuse;
    this.specular = specular;
  }
}
