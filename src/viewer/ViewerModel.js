import * as Croquet from "@croquet/croquet";

class ViewerModel extends Croquet.Model {
  init() {
    this.subscribe("model", "incrementphotoindex", this.incrementPhotoIndex);
    this.subscribe("model", "setinitposition", this.setInitPosition);
    this.photoIndex = 0;
    this.initialPosition = undefined;
  }

  incrementPhotoIndex(data) {
    this.photoIndex = data.photoIndex;
    this.publish("viewer", "selectphoto", data);
  }

  setInitPosition(initPosArr) {
    this.initialPositionArr = initPosArr;
  }
}

export default ViewerModel;
