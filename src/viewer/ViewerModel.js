import * as Croquet from "@croquet/croquet";

class ViewerModel extends Croquet.Model {
  init() {
    this.subscribe("viewer", "remoteselectphoto", this.SelectPhoto);
  }

  SelectPhoto(data) {
    this.publish("viewer", "selectphoto", data);
  }
}

export default ViewerModel;
