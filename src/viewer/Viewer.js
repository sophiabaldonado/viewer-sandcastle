import * as Croquet from "@croquet/croquet";
import ViewerModel from "./viewerModel";
import ViewerView from "./viewerView";
import PMAEventHandler from "pluto-mae";
const pmaEventHandler = new PMAEventHandler();

const Q = Croquet.Constants;
// events
Q.INCREMENT_PHOTO_INDEX = "incrementphotoindex";
Q.SELECT_PHOTO = "selectphoto";
Q.SET_INIT_POSITION = "setinitposition";

// state
Q.INTIAL_POSITION = undefined;
Q.PHOTO_INDEX = 0;

const Viewer = () => {
  ViewerModel.register("ViewerModel");

  const xrpkAppId = pmaEventHandler.getAppState().appId;
  const appId = "com.plutovr.threesixtyviewer";
  const name = xrpkAppId ? xrpkAppId : Math.floor(Math.random() * 123456789);
  const password = "password";

  Croquet.Session.join({
    appId,
    name,
    password,
    model: ViewerModel,
    view: ViewerView,
    autoSleep: false,
  });
};

export default Viewer;
