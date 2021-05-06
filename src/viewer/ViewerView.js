import * as Croquet from "@croquet/croquet";
import { Scene, Vector3 } from "three";
import loadScene from "../engine/engine";
import State from "../engine/state";
import Input from "./input";
import UI from "./ui";

const Q = Croquet.Constants;

class ViewerView extends Croquet.View {
  constructor(model) {
    super(model);
    this.sceneModel = model;

    State.currentPhotoIndex = this.sceneModel.photoIndex;
    if (this.sceneModel.initialPositionArr)
      State.initialPosition = new Vector3().fromArray(
        this.sceneModel.initialPositionArr
      );

    this.subscribe("viewer", Q.SELECT_PHOTO, this.selectPhoto);

    State.eventHandler.addEventListener(
      "incrementphotoindex",
      this.incrementPhotoIndex.bind(this)
    );

    State.eventHandler.addEventListener(
      "setinitposition",
      this.setInitPosition.bind(this)
    );

    this.scene = new Scene();
    loadScene(this.scene);

    this.ui = new UI(this.scene);
    const input = new Input(this.scene, this.ui);
  }
  incrementPhotoIndex(increment) {
    this.currentPhotoIndex = this.ui.retrieveNextPhotoIndex(increment);
    const data = { photoIndex: this.currentPhotoIndex };
    this.publish("model", Q.INCREMENT_PHOTO_INDEX, data);
  }
  selectPhoto(data) {
    State.eventHandler.dispatchEvent("selectphoto", data);
  }

  setInitPosition(initPosition) {
    const initPosArr = initPosition.toArray();
    this.publish("model", Q.SET_INIT_POSITION, initPosArr);
  }
}
export default ViewerView;
