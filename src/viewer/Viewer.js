// CHANGE #14
// remove keyboard input

import * as Croquet from "@croquet/croquet";
import ViewerModel from "./ViewerModel";
import ViewerView from "./ViewerView";
import PMAEventHandler from "pluto-mae";

const Viewer = () => {
  ViewerModel.register("ViewerModel");

  const pmaEventHandler = new PMAEventHandler();
  const xrpkAppId = pmaEventHandler.getAppState().appId;
  const appId = "com.plutovr.threesixtyviewer";
  // const name = xrpkAppId ? xrpkAppId : Math.floor(Math.random() * 123456789);
  const name = xrpkAppId ? xrpkAppId : "test";
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
