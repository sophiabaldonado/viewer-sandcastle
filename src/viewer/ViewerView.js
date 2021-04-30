import * as Croquet from "@croquet/croquet";
import {
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Scene,
  TextureLoader,
  Vector3,
  Quaternion,
  SphereGeometry,
  PMREMGenerator,
  Clock,
  EquirectangularReflectionMapping,
  RepeatWrapping,
  BoxGeometry,
  VideoTexture,
  RGBAFormat,
  PlaneBufferGeometry,
  LoadingManager,
  Raycaster,
  LineBasicMaterial,
  Line,
  Matrix4,
  BufferGeometry,
} from "three";

import loadScene from "../engine/engine";
import Renderer from "../engine/renderer";
import XRInput from "../engine/xrinput";
import State from "../engine/state";
import { Camera } from "../engine/engine";

const loaderIconPath = require("./assets/videos/transparent.webm");
const photo1 = require("./assets/images/photo1.jpg");
const photo2 = require("./assets/images/photo2.jpg");
const photo3 = require("./assets/images/photo3.jpg");
const photo4 = require("./assets/images/photo4.jpg");
const photo5 = require("./assets/images/photo5.jpg");

class ViewerView extends Croquet.View {
  constructor(model) {
    super(model);
    this.sceneModel = model;

    this.scene = new Scene();
    loadScene(this.scene);

    this.clock = new Clock();

    this.createLoadManager();
    this.createHolodeck();
    this.createOrbContainer();
    this.createLoaderIcon();

    Camera.Update = () => {
      if (!State.isXRSession) return;
      Camera.matrixWorld.decompose(
        Camera.position,
        Camera.quaternion,
        Camera.scale
      );
    };
    Promise.all([
      this.loader.load(photo1),
      this.loader.load(photo2),
      this.loader.load(photo3),
      this.loader.load(photo4),
      this.loader.load(photo5),
    ]).then(result => {
      // doesn't actually work, use loading manager
      this.photos = result;
      result.forEach(photo => {
        photo.mapping = EquirectangularReflectionMapping;
        photo.wrapS = photo.wrapT = RepeatWrapping;
      });
    });

    this.orbRadius = 0.15;

    // croquet events
    this.subscribe("viewer", "selectphoto", this.loadPhoto);

    this.currentPhotoIndex = this.sceneModel.photoIndex;
    this.isselecting = false;

    //xrpk alternative using gamepad:
    const InputHandler = new Object3D();

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
        if (!controller._raycastAt) return;
        // const d = controller.position.distanceTo(
        //   controller._raycastAt.position
        // );
        // controller.children[0].scale.setScalar(d);
        // controller.children[0].geometry.needsUpdate = true;
      };
    });

    State.eventHandler.addEventListener(
      "selectstart",
      this.onSelectStart.bind(this)
    );
    State.eventHandler.addEventListener(
      "selectend",
      this.onSelectEnd.bind(this)
    );

    // placeholder for testing
    window.addEventListener("keydown", e => {
      if (e.key == "ArrowRight") {
        this.incrementPhotoIndex(1);
      } else if (e.key == "ArrowLeft") {
        this.incrementPhotoIndex(-1);
      } else if (e.key == "r") {
        this.resetOrbContainer();
      }
    });

    State.eventHandler.addEventListener("xrsessionstarted", e => {
      setTimeout(() => {
        this.resetOrbContainer();
      }, 100);
    });
    State.eventHandler.addEventListener("xrsessionended", e => {
      setTimeout(() => {
        this.resetOrbContainer();
      }, 100);
    });
  }

  clearPlaceholders() {
    this.grid.visible = false;
    this.loaderMesh.visible = false;
  }

  handlePhotoselection(e, button) {
    // xrpk way
    XRInput.inputSources.forEach((inputSource, i) => {
      if (e.handedness === inputSource.handedness) {
        this.primaryIndex = i;
      }
    });
    this.primaryController = Renderer.xr.getController(this.primaryIndex);

    let handInSphere = this.SphereDistanceTest(
      this.primaryController.position,
      this.orbRadius
    );
    if (handInSphere) this.CyclePhoto();
  }

  loadPhoto(data) {
    this.select(data.photoIndex);
  }

  createSkybox() {
    const pmremGenerator = new PMREMGenerator(Renderer);
    pmremGenerator.compileEquirectangularShader();

    let photoTexture = this.photos[this.currentPhotoIndex];
    this.scene.background = photoTexture;

    // let geometry = new SphereBufferGeometry(500, 180, 180);
    // geometry.scale(-1, 1, 1);
    // this.skyboxMaterial = new MeshBasicMaterial({
    //   map: photoTexture,
    //   precision: "highp",
    // });
    // this.skybox = new Mesh(geometry, this.skyboxMaterial);
    // this.scene.add(this.skybox);
  }

  createOrbContainer() {
    this.orbContainer = new Object3D();
    this.orbContainer.raycastable = true;
    this.scene.add(this.orbContainer);
    this.frontAnchor = new Object3D();
    this.frontAnchor.position.z -= 1;
    setTimeout(() => {
      Camera.add(this.frontAnchor);
      Camera.position.z += 1;
      this.resetOrbContainer();
    }, 300);
  }

  resetOrbContainer() {
    this.camProxy = new Object3D();
    const tempCamVec = new Vector3();
    const tempFrontVec = new Vector3();
    const tempQuat = new Quaternion();
    const tempScale = new Vector3();

    this.frontAnchor.matrixWorld.decompose(tempFrontVec, tempQuat, tempScale);
    Camera.matrixWorld.decompose(tempCamVec, tempQuat, tempScale);
    this.camProxy.position.copy(tempCamVec);
    this.orbContainer.position.copy(tempFrontVec);
    this.orbContainer.lookAt(this.camProxy.position);
  }

  createLoaderIcon() {
    // loader icon
    const loaderIcon = document.createElement("Video");
    loaderIcon.src = loaderIconPath;
    loaderIcon.load();
    loaderIcon.play();
    loaderIcon.loop = true;
    const loaderTexture = new VideoTexture(loaderIcon);
    loaderTexture.format = RGBAFormat;

    const loaderGeo = new PlaneBufferGeometry(0.15, 0.15);
    const loaderMat = new MeshBasicMaterial({
      map: loaderTexture,
      transparent: true,
    });

    this.loaderMesh = new Mesh(loaderGeo, loaderMat);
    this.loaderMesh.position.z += 0.05;
    this.loaderMesh.ignoreRaycast = true;
    this.orbContainer.add(this.loaderMesh);
  }

  createSelectionOrbs() {
    let photoTexture1 = this.photos[this.retrieveNextPhotoIndex(1)];
    let photoTexture2 = this.photos[this.retrieveNextPhotoIndex(-1)];

    let geometry = new SphereGeometry(this.orbRadius, 20, 20);
    geometry.scale(-1, 1, 1);
    let orbMaterial1 = new MeshBasicMaterial({
      color: 0xbbbbbb,
    });
    let orbMaterial2 = new MeshBasicMaterial({
      color: 0xbbbbbb,
    });
    let sphere = new Mesh(geometry, orbMaterial1);
    sphere.position.setY(1.2);
    sphere.position.setZ(-1);

    this.selectionOrb1 = sphere.clone();
    this.selectionOrb1.position.setX(-0.5);
    this.selectionOrb1.material.map = photoTexture1;
    this.selectionOrb1.Update = () => {
      this.selectionOrb1.position.y =
        -Math.sin(this.clock.getElapsedTime() * 2) / 40;
      this.selectionOrb1.material.map.offset.x += 0.0005;
    };
    this.selectionOrb1.inc = -1;
    this.orbContainer.add(this.selectionOrb1);

    this.selectionOrb2 = sphere.clone();
    this.selectionOrb2.material = orbMaterial2;
    this.selectionOrb2.material.map = photoTexture2;
    this.selectionOrb2.position.setX(0.5);
    this.selectionOrb2.Update = () => {
      this.selectionOrb2.position.y =
        Math.sin(this.clock.getElapsedTime() * 2) / 40;
      this.selectionOrb2.material.map.offset.x += 0.0005;
    };
    this.selectionOrb2.inc = 1;

    this.orbContainer.add(this.selectionOrb2);
  }

  select(currentPhoto) {
    this.currentPhotoIndex = currentPhoto;
    // this.skybox.material.map = this.photos[currentPhoto];
    this.scene.background = this.photos[currentPhoto];
    this.selectionOrb1.material.map = this.photos[
      this.retrieveNextPhotoIndex(1)
    ];
    this.selectionOrb2.material.map = this.photos[
      this.retrieveNextPhotoIndex(-1)
    ];
  }

  createHolodeck() {
    const gridGeo = new BoxGeometry(9, 9, 9, 10, 10, 10);
    const gridMat = new MeshBasicMaterial({ wireframe: true, color: 0xd9cd2b });
    this.grid = new Mesh(gridGeo, gridMat);
    this.grid.position.y += 4.5;
    this.grid.Update = () => {};
    this.scene.add(this.grid);
  }

  incrementPhotoIndex(increment) {
    this.currentPhotoIndex = this.retrieveNextPhotoIndex(increment);
    const data = { photoIndex: this.currentPhotoIndex };
    this.publish("model", "incrementphotoindex", data);
  }

  retrieveNextPhotoIndex(inc) {
    if (this.currentPhotoIndex + inc < 0) {
      return this.photos.length - 1;
    } else if (this.currentPhotoIndex + inc > this.photos.length - 1) {
      return 0;
    } else {
      return this.currentPhotoIndex + inc;
    }
  }

  createLoadManager() {
    this.loadManager = new LoadingManager();
    this.loader = new TextureLoader(this.loadManager);

    // load Manager
    this.loadManager.onStart = function (url, itemsLoaded, itemsTotal) {
      // console.log(
      //   "Started loading file: " +
      //     url +
      //     ".\nLoaded " +
      //     itemsLoaded +
      //     " of " +
      //     itemsTotal +
      //     " files."
      // );
    };

    this.loadManager.onLoad = () => {
      console.log("Loading complete!");
      this.clearPlaceholders();
      this.createSelectionOrbs();
      this.createSkybox();
    };

    this.loadManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      // console.log(
      //   "Loading file: " +
      //     url +
      //     ".\nLoaded " +
      //     itemsLoaded +
      //     " of " +
      //     itemsTotal +
      //     " files."
      // );
    };

    this.loadManager.onError = url => {
      console.log("There was an error loading " + url);
    };
  }

  addRayCastVisualizer(controller) {
    const geometry = new BufferGeometry().setFromPoints([
      new Vector3(0, 0, 0),
      new Vector3(0, 0, -1),
    ]);

    const mat = new LineBasicMaterial({
      color: 0xffff00,
      transparent: true,
    });
    const line = new Line(geometry, mat);
    line.name = "line";
    line.ignoreRaycast = true;
    controller.add(line);
  }
  raycast(controller) {
    if (!controller) {
      console.error("no controller found!");
      return;
    }
    this._tempMatrix.identity().extractRotation(controller.matrixWorld);
    this._raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    this._raycaster.ray.direction.set(0, 0, -1).applyMatrix4(this._tempMatrix);

    const intersects = this._raycaster.intersectObject(this.orbContainer, true);
    return this.getIntersections(intersects);
  }

  getIntersections(intersects) {
    if (!intersects.length) return;
    for (let i = 0; i < intersects.length; i++) {
      return intersects[0].object;
    }
  }

  onSelectEnd(e) {}
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
    this.incrementPhotoIndex(controller._raycastAt.inc);
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

export default ViewerView;
