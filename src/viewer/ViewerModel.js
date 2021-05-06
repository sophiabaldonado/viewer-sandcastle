import * as Croquet from "@croquet/croquet";

const Q = Croquet.Constants;

class ViewerModel extends Croquet.Model {
  init() {
    this.subscribe("model", Q.INCREMENT_PHOTO_INDEX, this.incrementPhotoIndex);
    this.subscribe("model", Q.SET_INIT_POSITION, this.setInitPosition);
    this.photoIndex = Q.PHOTO_INDEX;
    this.initialPosition = Q.INITIAL_POSITION;
  }

  incrementPhotoIndex(data) {
    this.photoIndex = data.photoIndex;
    this.publish("viewer", Q.SELECT_PHOTO, data);
  }

  setInitPosition(initPosArr) {
    this.initialPositionArr = initPosArr;
  }
}

export default ViewerModel;
