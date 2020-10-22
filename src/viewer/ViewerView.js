import * as Croquet from "@croquet/croquet";
import {
  AmbientLight,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Scene,
  TextureLoader,
  Vector3,
  SphereBufferGeometry,
  SphereGeometry,
} from "three";
import loadScene from "../engine/engine";
import Renderer from "../engine/renderer";
import XRInput from "../engine/xrinput";

const photo1 = require("./assets/images/photo1.jpg");
const photo2 = require("./assets/images/photo2.jpg");

class ViewerView extends Croquet.View {
  constructor(model) {
    super(model);

    this.scene = new Scene();
    this.scene.add(new AmbientLight(0xffffff, 4));
    loadScene(this.scene);
    this.loader = new TextureLoader();

    this.photos = [this.loader.load(photo1), this.loader.load(photo2)];
    this.orbRadius = .15;

    // croquet events
    this.subscribe("viewer", "selectphoto", this.LoadPhoto);

    this.currentPhoto = 0;
    this.isSelecting = false;

    //xrpk alternative using gamepad:
    const InputHandler = new Object3D();

    InputHandler.Update = () => {
      if (!XRInput.inputSources) return;
      XRInput.inputSources.forEach(e => {
        if (!e.gamepad) return;
        e.gamepad.buttons.forEach((button, i) => {
          if (button.pressed === true && this.isSelecting === false) {
            this.pressedButton = button;
            this.isSelecting = true;
            this.HandlePhotoSelection(e, button);
          }
        });

        if (this.pressedButton && this.pressedButton.pressed === false && this.isSelecting === true) {
          this.isSelecting = false;
        }
      });
    };
    this.scene.add(InputHandler);

    // input init
    // default to right hand.
    // avoid XRInputs data structures due to XRPK oninputsourcechange bug
    this.primaryController = Renderer.xr.getController(0);
    this.scene.add(this.primaryController);
    this.CreateSkybox();
    this.CreateSelectionOrb();
  }

  HandlePhotoSelection(e, button) {
    // xrpk way
    XRInput.inputSources.forEach((inputSource, i) => {
      if (e.handedness === inputSource.handedness) {
        this.primaryIndex = i;
      }
    });
    this.primaryController = Renderer.xr.getController(this.primaryIndex);

    let handInSphere = this.SphereDistanceTest(this.primaryController.position, this.orbRadius)
    if (handInSphere)
      this.CyclePhoto();
  }

  SphereDistanceTest(pos, dist) {
    if (!this.selectionOrb) return;

    let controllerPos = new Vector3(pos.x, pos.y, pos.z);
    let spherePos = new Vector3();
    this.selectionOrb.getWorldPosition(spherePos);
    let d = controllerPos.sub(spherePos);

    return (d.x * d.x + d.y * d.y + d.z * d.z) < Math.pow(dist, 2);
  }

  LoadPhoto(data) {
    this.Select(data.photoIndex);
  }

  CreateSkybox() {
    let geometry = new SphereBufferGeometry(500, 180, 180);
    geometry.scale(- 1, 1, 1);

    let photoTexture = this.photos[this.currentPhoto];
    this.skyboxMaterial = new MeshBasicMaterial({
        map: photoTexture,
        precision: "highp",
    });
    this.skybox = new Mesh(geometry, this.skyboxMaterial);
    this.scene.add(this.skybox);
  };

  CreateSelectionOrb() {
    let photoTexture = this.photos[this.NextPhoto()];

    let geometry = new SphereGeometry(this.orbRadius, 20, 20);
    geometry.scale(- 1, 1, 1);
    let material = new MeshBasicMaterial({
      color: 0xffffff,
      map: photoTexture,
    });
    let sphere = new Mesh( geometry, material );
    sphere.position.setY(1.2);
    sphere.position.setZ(-1);

    this.selectionOrb = sphere;
    this.scene.add(this.selectionOrb);
  }

  Select(index) {
    this.currentPhoto = index;

    this.skybox.material.map = this.photos[this.currentPhoto];
    this.selectionOrb.material.map = this.photos[this.NextPhoto()]
  }

  CyclePhoto() {
    this.Select(this.NextPhoto());
    let data = { photoIndex: this.currentPhoto };
    this.publish("viewer", "remoteselectphoto", data);
  }

  NextPhoto() {
    return (this.currentPhoto + 1) % this.photos.length;
  }
}

export default ViewerView;
