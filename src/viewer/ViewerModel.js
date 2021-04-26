import * as Croquet from "@croquet/croquet";

class ViewerModel extends Croquet.Model {
  init() {
    this.subscribe("viewer", "remoteselectphoto", this.SelectPhoto);
    this.photoIndex = 0;
  }

  SelectPhoto(data) {
    this.photoIndex = data.photoIndex;
    this.publish("viewer", "selectphoto", data);
  }
}

export default ViewerModel;
