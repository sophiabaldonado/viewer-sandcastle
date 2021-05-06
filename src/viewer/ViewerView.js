import * as Croquet from "@croquet/croquet";
import { Scene } from "three";
import loadScene from "../engine/engine";
import State from "../engine/state";
import Input from "./input";
import UI from "./ui";

class ViewerView extends Croquet.View {
  constructor(model) {
    super(model);
    this.sceneModel = model;
    State.currentPhotoIndex = this.sceneModel.photoIndex;

    this.scene = new Scene();
    loadScene(this.scene);

    this.ui = new UI(this.scene);
    const input = new Input(this.scene, this.ui);

    // croquet events
    this.subscribe("viewer", "selectphoto", this.selectPhoto);
    State.eventHandler.addEventListener("xrsessionstarted", e => {
      setTimeout(() => {
        this.ui.resetOrbContainer();
      }, 100);
    });
    State.eventHandler.addEventListener("xrsessionended", e => {
      setTimeout(() => {
        this.ui.resetOrbContainer();
      }, 100);
    });

    State.eventHandler.addEventListener(
      "incrementphotoindex",
      this.incrementPhotoIndex.bind(this)
    );
  }
  incrementPhotoIndex(increment) {
    this.currentPhotoIndex = this.ui.retrieveNextPhotoIndex(increment);
    const data = { photoIndex: this.currentPhotoIndex };
    this.publish("model", "incrementphotoindex", data);
  }
  selectPhoto(data) {
    State.eventHandler.dispatchEvent("selectphoto", data);
  }
}
export default ViewerView;
