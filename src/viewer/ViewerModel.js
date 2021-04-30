import * as Croquet from "@croquet/croquet";

class ViewerModel extends Croquet.Model {
  init() {
    this.subscribe("model", "incrementphotoindex", this.incrementPhotoIndex);
    this.photoIndex = 0;
  }

  incrementPhotoIndex(data) {
    this.photoIndex = data.photoIndex;
    this.publish("viewer", "selectphoto", data);
  }
}

export default ViewerModel;
