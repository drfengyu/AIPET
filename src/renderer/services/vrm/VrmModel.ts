import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EmoteController } from './EmoteController';

export class VrmModel {
  public vrm?: VRM | null;
  public emoteController?: EmoteController;

  private _lookAtTargetParent: THREE.Object3D;

  constructor(lookAtTargetParent: THREE.Object3D) {
    this._lookAtTargetParent = lookAtTargetParent;
  }

  async loadVRM(url: string): Promise<void> {
    const loader = new GLTFLoader();
    loader.crossOrigin = 'anonymous';

    loader.register((parser) =>
      new VRMLoaderPlugin(parser, { autoUpdateHumanBones: true }),
    );

    const gltf = await loader.loadAsync(url);

    VRMUtils.removeUnnecessaryVertices(gltf.scene);
    VRMUtils.removeUnnecessaryJoints(gltf.scene);

    const vrm = (this.vrm = gltf.userData.vrm);
    vrm.scene.name = 'VRMRoot';
    VRMUtils.rotateVRM0(vrm);

    this.emoteController = new EmoteController(vrm, this._lookAtTargetParent);

    vrm.scene.traverse((obj) => { obj.frustumCulled = false; });
  }

  unload() {
    if (this.vrm) {
      VRMUtils.deepDispose(this.vrm.scene);
      this.vrm = null;
    }
  }

  update(delta: number): void {
    if (this.vrm) this.vrm.update(delta);
    this.emoteController?.update(delta);
  }
}
