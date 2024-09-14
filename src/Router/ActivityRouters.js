import { Router, application } from "express";




import { AuthMiddleware } from "./Middleware/AuthMiddleware.js";
import ActivityController from "../Controller/ActivityController.js";

export let ActivityRouters = Router();

application.prefix = Router.prefix = function (path, middleware, configure) {
  configure(ActivityRouters);
  this.use(path, middleware, ActivityRouters);
  return ActivityRouters;
};

ActivityRouters.prefix("/activity", AuthMiddleware, async function () {  

 ActivityRouters.route("/createsubactivity").post(ActivityController.createActivityforCase);  
 ActivityRouters.route("/updatesubactivity/:id").put(ActivityController.updateActivityforCase);  
 ActivityRouters.route("/getsubactivity/:id").get(ActivityController.getActivityforCase);  
 
 


  


});
