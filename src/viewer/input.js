import {
  Raycaster,
  LineBasicMaterial,
  Line,
  Matrix4,
  BufferGeometry,
  Vector3,
} from "three";

import Renderer from "../engine/renderer";
import State from "../engine/state";

class Input {
  constructor(scene, ui) {
    this.scene = scene;
    this.ui = ui;
    this.scene.traverse(child => {
      if (child.name === "OrbContainer") {
        this.orbContainer = child;
        return;
      }
    });
    // XR controllers
    this._raycaster = new Raycaster();
    this._tempMatrix = new Matrix4();
    this._controller1 = Renderer.xr.getController(0);
    this._controller2 = Renderer.xr.getController(1);
    this._controller1.handedness = "left";
    this._controller2.handedness = "right";
    this._controllers = [this._controller1, this._controller2];
    this._controllers.forEach(controller => {
      this.scene.add(controller);
      this.addRayCastVisualizer(controller);
      controller.Update = () => {
        controller._raycastAt = this.raycast(controller);
        controller.children[0].material.opacity =
          controller._raycastAt == undefined ? 0 : 1;
      };
    });
    State.eventHandler.addEventListener(
      "selectstart",
      this.onSelectStart.bind(this)
    );
  }
  addRayCastVisualizer(controller) {
    const geometry = new BufferGeometry().setFromPoints([
      new Vector3(0, 0, 0),
      new Vector3(0, 0, -1),
    ]);
    const mat = new LineBasicMaterial({
      color: 0xff00ff,
      transparent: true,
    });
    const line = new Line(geometry, mat);
    line.name = "line";
    line.ignoreRaycast = true;
    controller.add(line);
  }
  raycast(controller) {
    if (!this.orbContainer) return;
    if (!controller) {
      console.error("no controller found!");
      return;
    }
    this._tempMatrix.identity().extractRotation(controller.matrixWorld);
    this._raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    this._raycaster.ray.direction.set(0, 0, -1).applyMatrix4(this._tempMatrix);

    const intersects = this._raycaster.intersectObject(
      this.ui.orbContainer,
      true
    );
    return this.getIntersections(intersects);
  }
  getIntersections(intersects) {
    if (!intersects.length) return;
    for (let i = 0; i < intersects.length; i++) {
      return intersects[0].object;
    }
  }
  onSelectStart(e) {
    this.onselect(this.getControllerFromInputSource(e));
  }
  onselect(controller) {
    if (
      controller._raycastAt == undefined ||
      controller._raycastAt.ignoreRaycast ||
      !controller._raycastAt.inc
    )
      return;
    State.eventHandler.dispatchEvent(
      "incrementphotoindex",
      controller._raycastAt.inc
    );
  }
  getControllerFromInputSource(event) {
    const c = this._controllers.find(
      controller => controller.handedness === event.inputSource.handedness
    );
    if (!c)
      throw Error(
        `no controller matching event's handedness found!\n${this._controllers[0].handedness}\n${this._controllers[1].handedness}\n${event.inputSource.handedness}`
      );
    else return c;
  }
}
export default Input;
