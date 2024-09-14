
import { Router,application } from "express";
import {  AuthMiddleware } from "./Middleware/AuthMiddleware.js";
import UserController from "../Controller/UserController.js";

export let UserRouters = Router();





application.prefix = Router.prefix = function (path, middleware, configure) {
    configure(UserRouters);
    this.use(path, middleware, UserRouters);
    return UserRouters;
  };
  


  UserRouters.prefix("/user", AuthMiddleware, () => {

    HuntRouters.route("/createhunt")
    .post(UploadFilter.uploadEvents.single("file"), HuntController.createHunt)


  });
  




