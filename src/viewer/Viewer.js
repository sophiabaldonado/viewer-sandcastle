import * as Croquet from "@croquet/croquet";
import ViewerModel from "./ViewerModel";
import ViewerView from "./ViewerView";

const Viewer = () => {
  ViewerModel.register();
  Croquet.Session.join("jrsdgjuzkawaawi", ViewerModel, ViewerView);
};

export default Viewer;
