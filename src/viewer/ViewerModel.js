import * as Croquet from "@croquet/croquet";
import { Color } from "three";

class ViewerModel extends Croquet.Model {
  static types() {
    return {
      Color: Color,
    };
  }

  init() {
    this.subscribe("viewer", "remoteselectphoto", this.SelectPhoto);
  }

  SelectPhoto(data) {
    this.publish("viewer", "selectphoto", data);
  }
}

export default ViewerModel;
