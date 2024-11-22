import { Router, application } from "express";
import AuthController from "../Controller/AuthController.js";
import AuditController from "../Controller/AuditController.js";
import RecordController from "../Controller/RecordController.js";
import multer from "multer";

import { AuthMiddleware } from "./Middleware/AuthMiddleware.js";
import ActivityController from "../Controller/ActivityController.js";


export let AuthRouters = Router();


AuthRouters.route("/login").post(AuthController.LoginUser);
AuthRouters.route("/signUp").post(AuthController.SignUp);
AuthRouters.route("/forgetpassword").post(AuthController.forgetPassword);
AuthRouters.route("/sociallogin").post(AuthController.SocialLoginUser);
AuthRouters.route("/getallcompanies").get(AuthController.getCompanies);
AuthRouters.route("/completeprofile").post(AuthController.completeProfile);
AuthRouters.route("/verifyprofile").post(AuthController.verifyProfile);


application.prefix = Router.prefix = function (path, middleware, configure) {
  configure(AuthRouters);
  this.use(path, middleware, AuthRouters);
  return AuthRouters;
};

AuthRouters.prefix("/user", AuthMiddleware, async function () {  
  AuthRouters.route("/update").post(AuthController.updateUser);
  AuthRouters.route("/updateUserMultipleImages").post(AuthController.updateUserMultipleImages);    
  AuthRouters.route("/getprofile").get(AuthController.getProfile);     
  AuthRouters.route("/managers/:companyId").get(AuthController.getComapnyManager); 
  AuthRouters.route("/resetpassword").post(AuthController.resetpassword);     
  AuthRouters.route("/Verify").post(AuthController.VerifyOtp);
  AuthRouters.route("/logout").post(AuthController.logout);
  AuthRouters.route("/resetExistingPassword").post(AuthController.resetExistingPassword);   
 AuthRouters.route("/createsubactivity").post(ActivityController.createActivityforCase);  
 AuthRouters.route("/reviews").get(RecordController.getAllCases);  
 AuthRouters.route("/updatesubactivity/:id").put(ActivityController.updateActivityforCase);  
 AuthRouters.route("/getsubactivity/:id").get(ActivityController.getActivityforCase);  
 AuthRouters.route("/createpreaudit").post(AuditController.CreatePreAudit);
 AuthRouters.route("/createStartStudy").post(AuditController.CreateStartStudy);
 AuthRouters.route("/getStartStudy").get(AuditController.getStartStudy);
 AuthRouters.route("/getStartStudy/:caseNumber").get(AuditController.getStartStudyByCaseNumber);
 AuthRouters.route("/getNonActivites/:PreAuditId").get(AuditController.getNonActivites);   
 AuthRouters.route("/createaudit").post(AuditController.CreateAudit);  
 AuthRouters.route("/createnonvalueactivity").post(AuditController.CreateNonValueAdded);  
  
 AuthRouters.route("/auditreport").post(RecordController.MatchPreAuditAndAudit);
 AuthRouters.route("/getaudit").post(AuditController.getAudit); 

 
 
 
 
 
 
 
 


  


});
