import { Router, application } from "express";
import { AdminMiddleware } from "./Middleware/AuthMiddleware.js";
//import EventController from "../Controller/EventsController.js";
import UploadFilter from "../Utils/filefilter.js";
import RecordController from "../Controller/RecordController.js";
import { AuthMiddleware } from "./Middleware/AuthMiddleware.js";

export let RecordRouters = Router();

application.prefix = Router.prefix = function (path, middleware, configure) {
  configure(RecordRouters);
  this.use(path, middleware, RecordRouters);
  return RecordRouters;
};

RecordRouters.prefix("/user", AuthMiddleware, async function () {  
    RecordRouters.route("/createRecord").post(RecordController.createRecord);
    
  })

