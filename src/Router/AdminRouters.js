import { Router,application } from "express";
import { AdminMiddleware } from "./Middleware/AuthMiddleware.js";
import AdminController from "../Controller/AdminController.js";
import ContentTextController from "../Controller/ContentController.js";
import AuthController from "../Controller/AuthController.js";
import UserController from "../Controller/UserController.js";
import RecordController from "../Controller/RecordController.js";




export let AdminRouters = Router();


application.prefix = Router.prefix = function (path, middleware, configure) {
    configure(AdminRouters);
    this.use(path, middleware, AdminRouters);
    return AdminRouters;
  };

    
  AdminRouters.prefix("/admin", AdminMiddleware, () => {
    AdminRouters.route("/addindustry").post(AdminController.createIndustry);
    AdminRouters.route("/addroles").post(AdminController.createRoles);
    AdminRouters.route("/addactivity").post(AdminController.createActivity);
 
    AdminRouters.route("/createUser").post(AdminController.createUser);
    AdminRouters.route("/getallusers").get(AdminController.getAllUsers);
    AdminRouters.route("/deleteuser/:id").patch(AdminController.deleteUser);
    AdminRouters.route("/sendNotification").post(AdminController.SendNotification);
    AdminRouters.route("/getrolesbyid").post(AdminController.getRolesbyID);
    AdminRouters.route("/getallroles").get(AdminController.getAllRoles);
    AdminRouters.route("/getallactivities").get(AdminController.getAllActivities);
    AdminRouters.route("/getallcases").get(AdminController.getAllCases);
    AdminRouters.route("/getusercases/:id").get(AdminController.getUserCases);
    AdminRouters.route("/getcasedetails").get(AdminController.getCaseDetails);
    AdminRouters.route("/auditreport").get(RecordController.MatchPreAuditAndAudit);
    AdminRouters.route("/getUsersAnalytics").get(AdminController.getUsersAnalytics);
    AdminRouters.route("/dashboard-kpis").get(AdminController.getDashboardKpis);
    AdminRouters.route("/send-notification").post(AdminController.sendNotifications);
    

    
    

  //About Routes


    

  AdminRouters.route("/about")
    .post(ContentTextController.createDocument)
    .get(ContentTextController.getDocument);
    AdminRouters.route("/about/:id")
    .get(ContentTextController.getSingleDocument)
    .patch(ContentTextController.updateDocument)
    .delete(ContentTextController.deleteDocument);

  //Terms Routes

  AdminRouters.route("/terms")
    .post(ContentTextController.createDocument)
    .get(ContentTextController.getDocument);
  AdminRouters.route("/terms/:id")
    .get(ContentTextController.getSingleDocument)
    .patch(ContentTextController.updateDocument)
    .delete(ContentTextController.deleteDocument);

  //Privacy Routes

  AdminRouters.route("/privacy")
    .post(ContentTextController.createDocument)
    .get(ContentTextController.getDocument);
  AdminRouters.route("/privacy/:id")
    .get(ContentTextController.getSingleDocument)
    .patch(ContentTextController.updateDocument)
    .delete(ContentTextController.deleteDocument);
});

AdminRouters.route("/getrolesbyid").post(AdminController.getRolesbyID);
AdminRouters.route("/getallroles").get(AdminController.getAllRoles);
AdminRouters.route("/getallactivities").get(AdminController.getAllActivities);
AdminRouters.route("/getActivity").post(AdminController.getActivitybyRoles);


  AdminRouters.route("/industry").get(AdminController.getAllIndustries);
  AdminRouters.route("/getallindustries").get(AdminController.getIndustries);
  AdminRouters.route("/getindustries").get(AdminController.getIndustriesByfireBase);


  AdminRouters.route("/privacy")
.get(ContentTextController.getDocument);

AdminRouters.route("/terms")
    .get(ContentTextController.getDocument);

    AdminRouters.route("/about")
    .get(ContentTextController.getDocument);
  


