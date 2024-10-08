import fs from "fs";
import bcrypt, { compare } from "bcrypt";
import authModel from "../DB/Model/authModel.js";
import fileUploadModel from "../DB/Model/fileUploadModel.js";
import { handleMultipartData } from "../Utils/MultipartData.js";
import CustomError from "../Utils/ResponseHandler/CustomError.js";
import CustomSuccess from "../Utils/ResponseHandler/CustomSuccess.js";
import { comparePassword, hashPassword } from "../Utils/SecuringPassword.js";
import { sendEmails } from "../Utils/SendEmail.js";
import { mongoose } from "mongoose";
import { accessTokenValidator } from "../Utils/Validator/accessTokenValidator.js";
import NotificationController from "./NotificationController.js";
import jwt from "jsonwebtoken";

import {
  LoginUserValidator,
  RegisterUserValidator,
  ResetExistingPasswordValidator,
  ResetPasswordValidator,
  changePasswordValidator,
  createprofilevalidator,
  forgetpasswordValidator,
  updatevalidator,
  verifyOTPValidator,
} from "../Utils/Validator/UserValidator.js";
import { linkUserDevice, unlinkUserDevice } from "../Utils/linkUserDevice.js";
import { tokenGen } from "../Utils/AccessTokenManagement/Tokens.js";
import OtpModel from "../DB/Model/otpModel.js";
import { genSalt } from "../Utils/saltGen.js";
import { Types } from "mongoose";
import AuditModel from "../DB/Model/AuditModel.js";
import IndustryModel from "../DB/Model/industryModel.js";
import CompanyModel from "../DB/Model/companyModel.js";


const SocialLoginUser = async (req, res, next) => {
  try {

    const { deviceToken, deviceType, accessToken, socialType, userType } = req.body;
    const { hasError, message, data } = await accessTokenValidator(accessToken, socialType);
    if (hasError) {
      return next(CustomError.createError(message, 200));
    }
    const { name, image, identifier, dateOfBirth, gender } = data;

    const authmodel = await AuthModel.findOne({ identifier: identifier }).populate("profile");
    if (authmodel) {
      var UserProfile;

      if (authmodel.userType == "Customer") {
        const CustomerProfile = await CustomerModel.find({ auth: authmodel._id }).populate({
          path: "profile",
        });

        CustomerProfile.isCompleteProfile = authmodel.isCompleteProfile;

        const token = await tokenGen(CustomerProfile, "auth", deviceToken);
        // UserProfile = otpResource.BusinessWithToken(CustomerProfile, token);
        UserProfile = { ...CustomerProfile, token };
      }
      if (authmodel.userType == "Instructor") {
        const InstructorProfile = await InstructorModel.find({ auth: authmodel._id }).populate({
          path: "profile",
        });
        InstructorProfile.isCompleteProfile = authmodel.isCompleteProfile;
        const token = await tokenGen(InstructorProfile, "auth", deviceToken);
        // UserProfile = otpResource.WorkerWithToken(InstructorProfile, token);
        UserProfile = { ...InstructorProfile, token };
      }

      const { error } = await linkUserDevice(authmodel._id, deviceToken, deviceType);
      if (error) {
        return next(CustomError.createError(error, 200));
      }
      const respdata = {
        _id: UserProfile._id,
        fullName: UserProfile.fullName,
        follower: UserProfile.follower.length > 0 ? UserProfile.follower.length : 0,
        following: UserProfile.following.length > 0 ? UserProfile.following.length : 0,
        routine: UserProfile.routine,
        nutrition: UserProfile.nutrition,
        dietplane: UserProfile.dietplane,
        userType: authmodel.userType,
        image: await fileUploadModel.findOne({ _id: UserProfile.image }, { file: 1 }),
        isCompleteProfile: authmodel.isCompleteProfile,
        token: UserProfile.token,
      };
      return next(CustomSuccess.createSuccess(respdata, "User Logged In", 200));
    } else {
      // const genOpt = Math.floor(10000 + Math.random() * 90000);
      const authmodel = new AuthModel();
      authmodel.identifier = identifier;
      authmodel.password = password;
      authmodel.userType = userType;
      authmodel.socialId = socialID;
      authmodel.socialType = socialType;
      authmodel.accessToken = accessToken;
      await authmodel.save();
      var UserModel;
      if (userType == "Customer") {
        UserModel = await CustomerModel.create({
          auth: authmodel._id,
          fullName: name,
        });
        UserModel.save();
      } else {
        UserModel = await InstructorModel.create({
          auth: authmodel.id,
          fullName: name,
        });
        UserModel.save();
      }
      authmodel.profile = UserModel._id;
      await authmodel.save();
      const data = await AuthModel.findById(authmodel._id).populate("profile");

      const token = await tokenGen(data, "auth", deviceToken);

      const respdata = {
        _id: data.profile._id,
        fullName: data.profile.fullName,
        follower: data.profile.follower.length > 0 ? data.profile.length : 0,
        following: data.profile.following.length > 0 ? data.profile.length : 0,
        routine: data.profile.routine,
        nutrition: data.profile.nutrition,
        dietplane: data.profile.dietplane,
        userType: data.userType,
        image: { file: "" },
        isCompleteProfile: data.isCompleteProfile,
        token: token,
      };

      return next(CustomSuccess.createSuccess(respdata, "SignUp successfully", 200));
    }
  } catch (error) {
    return next(CustomError.createError(error.message, 500));
  }
};





//complete profile
const completeProfile = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    const hashedPassword = hashPassword(password);
    // Check if the email already exists
    const User = await authModel.findOne({ email });
    console.log(User)
    if (!User) {
      return next(CustomError.badRequest("You are not registered please contact Admin"));
    }


    if (User.isVerified == true) {
      return next(CustomError.badRequest("Account already created"));
    }
    let otp = Math.floor(Math.random() * 90000) + 100000;
    const emailData = {
      subject: "Aldebaran - Account Verification",
      html: `
  <div
    style = "padding:20px 20px 40px 20px; position: relative; overflow: hidden; width: 100%;"
  >
    <img 
          style="
          top: 0;position: absolute;z-index: 0;width: 100%;height: 100vmax;object-fit: cover;" 
          src="cid:background" alt="background" 
    />
    <div style="z-index:1; position: relative;">
    <header style="padding-bottom: 20px">
      <div class="logo" style="text-align:center;">
        <img 
          style="width: 150px;" 
          src="cid:logo" alt="logo" />
      </div>
    </header>
    <main 
      style= "padding: 20px; background-color: #f5f5f5; border-radius: 10px; width: 80%; margin: 0 auto; margin-bottom: 20px; font-family: 'Poppins', sans-serif;"
    >
      <h1 
        style="color: #FD6F3B; font-size: 30px; font-weight: 700;"
      >Welcome To Aldebaran</h1>
      <p
        style="font-size: 24px; text-align: left; font-weight: 500; font-style: italic;"
      >Hi ${User.name},</p>
      <p 
        style="font-size: 20px; text-align: left; font-weight: 500;"
      > Please use the following OTP to reset your password.</p>
      <h2
        style="font-size: 36px; font-weight: 700; padding: 10px; width:100%; text-align:center;color: #FD6F3B; text-align: center; margin-top: 20px; margin-bottom: 20px;"
      >${otp}</h2>
      <p style = "font-size: 16px; font-style:italic; color: #343434">If you did not request this email, kindly ignore this. If this is a frequent occurence <a
      style = "color: #FD6F3B; text-decoration: none; border-bottom: 1px solid #FD6F3B;" href = "#"
      >let us know.</a></p>
      <p style = "font-size: 20px;">Regards,</p>
      <p style = "font-size: 20px;">Dev Team</p>
    </main>
    </div>
  <div>
  `,
      attachments: [
        {
          filename: "logo.png",
          path: "./assets/logo.png",
          cid: "logo",
          contentDisposition: "inline",
        },
        // {
        //   filename: "bg.png",
        //   path: "./Uploads/bg.png",
        //   cid: "background",
        //   contentDisposition: "inline",
        // },
      ],
    };
    await sendEmails(
      email,
      emailData.subject,
      emailData.html,
      emailData.attachments
    );

    //user creds
    const newUser = {
      email: User.email,
      password: hashedPassword,
      name
    };

    var token = jwt.sign({ userData: newUser, otp }, 'secret') //jwt.sign({userData:newUser , otp:userOTP} , 'secret' , {expiresIn:1})

    return next(
      CustomSuccess.createSuccess(
        { token, otp },
        "Verification OTP has been sended",
        200
      )
    );


  } catch (error) {
    return next(CustomError.createError(error.message, 500));
  }
};

// Generate OTP 
const generateSignUpOtp = async ({ email, password, name }) => {
  try {
    const hashedPassword = hashPassword(password);


    let otp = Math.floor(Math.random() * 90000) + 100000;
    console.log(otp, "LOGIN OTP")
    const user = authModel.findOne({ email: email })
    if (!user) {
      return CustomError.createError("User not found", 400);
    }
    const otpCreated = OtpModel.create({
      auth: new mongoose.Types.ObjectId(user._id.toString()),
      otpKey: otp,
      reason: 'login'
    })

    const createdOTP = await otpCreated.save()
    console.log(createdOTP, "createdOTP")

    await authModel.findOneAndUpdate({ email: email },
      {
        otp: otp
      })
    const emailData = {
      subject: "Aldebaran - Account Verification",
      html: `
  <div
    style = "padding:20px 20px 40px 20px; position: relative; overflow: hidden; width: 100%;"
  >
    <img 
          style="
          top: 0;position: absolute;z-index: 0;width: 100%;height: 100vmax;object-fit: cover;" 
          src="cid:background" alt="background" 
    />
    <div style="z-index:1; position: relative;">
    <header style="padding-bottom: 20px">
      <div class="logo" style="text-align:center;">
        <img 
          style="width: 150px;" 
          src="cid:logo" alt="logo" />
      </div>
    </header>
    <main 
      style= "padding: 20px; background-color: #f5f5f5; border-radius: 10px; width: 80%; margin: 0 auto; margin-bottom: 20px; font-family: 'Poppins', sans-serif;"
    >
      <h1 
        style="color: #FD6F3B; font-size: 30px; font-weight: 700;"
      >Welcome To Aldebaran</h1>
      <p
        style="font-size: 24px; text-align: left; font-weight: 500; font-style: italic;"
      >Hi ${name},</p>
      <p 
        style="font-size: 20px; text-align: left; font-weight: 500;"
      > Please use the following OTP to reset your password.</p>
      <h2
        style="font-size: 36px; font-weight: 700; padding: 10px; width:100%; text-align:center;color: #FD6F3B; text-align: center; margin-top: 20px; margin-bottom: 20px;"
      >${otp}</h2>
      <p style = "font-size: 16px; font-style:italic; color: #343434">If you did not request this email, kindly ignore this. If this is a frequent occurence <a
      style = "color: #FD6F3B; text-decoration: none; border-bottom: 1px solid #FD6F3B;" href = "#"
      >let us know.</a></p>
      <p style = "font-size: 20px;">Regards,</p>
      <p style = "font-size: 20px;">Dev Team</p>
    </main>
    </div>
  <div>
  `,
      attachments: [
        {
          filename: "logo.png",
          path: "./assets/logo.png",
          cid: "logo",
          contentDisposition: "inline",
        },
      ],
    };
    sendEmails(
      email,
      emailData.subject,
      emailData.html,
      emailData.attachments
    );

    //user creds



    return { otp }


  } catch (error) {
    return CustomError.createError(error.message, 500);
  }
};


const verifyProfile = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // Check if the email already exists

    const userData = await authModel.findOne({ email: email })
    if (!userData) {
      return next(CustomError.badRequest("You are not registered please contact Admin"));
    }
    const findOTP = await OtpModel.findOne({ auth: userData._id, reason: 'login', otpUsed: false })
    if (!findOTP) {
      return next(CustomError.badRequest("Invalid OTP"));
    }
    console.log(findOTP, "FIND OTP")
    console.log(otp, findOTP.otpKey, "HASH")
    const decryptOTP = comparePassword(otp.toString(), findOTP.otpKey)
    console.log(decryptOTP, "DESCRYPT")

    if (!decryptOTP) {
      return next(CustomError.badRequest("Invalid OTP"));

    }


    const updateUser = await authModel.findByIdAndUpdate(userData._id, { isVerified: true }, {
      new: true,
    });

    const updateOTP = await OtpModel.deleteOne({ _id: findOTP._id })


    return next(
      CustomSuccess.createSuccess(
        { updateUser },
        "User Verified Succesfully",
        200
      )
    );


  } catch (error) {
    return next(CustomError.createError(error.message, 500));
  }
};



const updateUser = async (req, res, next) => {
  try {
    const data = Object.fromEntries(
      Object.entries(req.body).filter(([_, v]) => v != null && v !== "" && v !== "null")
    );

    const { deviceToken } = req.headers;
    const { error } = updatevalidator.validate(data);
    if (error) {
      return next(CustomError.badRequest(error.details[0].message));
    }

    const { user } = req;

    console.log("user UPDATED =>", user)

    if (!user) {
      return next(CustomError.badRequest("User Not Found"));
    }

    if (req.files['file']) {
      // Process 'file' upload if it exists in the request
      const file = req.files['file'][0];

      if (user.image && user.image.file != null && user.image.file != undefined) {
        fs.unlink("Uploads/" + user.image.file, (err) => {
          if (err) {
            console.error("Error deleting file:", err);
          }
        });
        await fileUploadModel.deleteOne(user.image?._id);
      }
      const FileUploadModel = await fileUploadModel.create({
        file: file.filename,
        fileType: file.mimetype,
        user: user._id,
      });
      data.image = FileUploadModel._id;
    }

    if (req.files['coverImageFile']) {
      // Process 'coverImageFile' upload if it exists in the request
      const coverImageFile = req.files['coverImageFile'][0];

      if (user.coverImage && user.coverImage.file != null && user.coverImage.file != undefined) {
        fs.unlink("Uploads/" + user.coverImage.file, (err) => {
          if (err) {
            console.error("Error deleting file:", err);
          }
        });
        await fileUploadModel.deleteOne(user.coverImage?._id);
      }
      const CoverImageModel = await fileUploadModel.create({
        file: coverImageFile.filename,
        fileType: coverImageFile.mimetype,
        user: user._id,
      });
      data.coverImage = CoverImageModel._id;
    }

    if (data.password) {
      data.password = hashPassword(data.password);
    }


    const updateUser = await authModel.findByIdAndUpdate(user._id, { isCompleted: true, ...data }, {
      new: true,
    });

    const token = await tokenGen(
      { id: updateUser._id, userType: updateUser.userType },
      "auth",
      deviceToken
    );

    const userdata = (
      await authModel.aggregate([
        {
          ///$match: { email: email, status: "accepted" },
          $match: { _id: user._id }
        },
        {
          $lookup: {
            from: "fileuploads",
            localField: "image",
            foreignField: "_id",
            as: "image",
          },
        },
        {
          $unwind: {
            path: "$image",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "fileuploads",
            localField: "coverImage",
            foreignField: "_id",
            as: "coverImage",
          },
        },
        {
          $unwind: {
            path: "$coverImage",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            devices: 0,
            loggedOutDevices: 0,
            otp: 0,
            updatedAt: 0,
            createdAt: 0,
            __v: 0,
            isDeleted: 0,
            "image.updatedAt": 0,
            "image.createdAt": 0,
            "image.__v": 0,
            "image.user": 0,
            "image.fileType": 0,
            "image._id": 0,
            "coverImage._id": 0,
            "coverImage.updatedAt": 0,
            "coverImage.createdAt": 0,
            "coverImage.__v": 0,
            "coverImage.user": 0,
            "coverImage.fileType": 0,
          },
        },
        { $limit: 1 },
      ])
    )[0];

    return next(
      CustomSuccess.createSuccess(
        { ...userdata, token },
        "Profile updated successfully",
        200
      )
    );
  } catch (error) {
    next(CustomError.createError(error.message, 500));
  }
};



const LoginUser = async (req, res, next) => {
  try {
    const { error } = LoginUserValidator.validate(req.body);
    if (error) {
      return next(CustomError.badRequest(error.details[0].message));
    }
    const { email, password, deviceType, deviceToken } = req.body;
    const AuthModel = (
      await authModel.aggregate([
        {
          ///$match: { email: email, status: "accepted" },
          $match: { email: email }
        },
        {
          $lookup: {
            from: "fileuploads",
            localField: "image",
            foreignField: "_id",
            as: "image",
          },
        },
        {
          $unwind: {
            path: "$image",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "fileuploads",
            localField: "coverImage",
            foreignField: "_id",
            as: "coverImage",
          },
        },
        {
          $unwind: {
            path: "$coverImage",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            devices: 0,
            loggedOutDevices: 0,
            otp: 0,
            updatedAt: 0,
            createdAt: 0,
            __v: 0,
            isDeleted: 0,
            "image.updatedAt": 0,
            "image.createdAt": 0,
            "image.__v": 0,
            "image.user": 0,
            "image.fileType": 0,
            "image._id": 0,
            "coverImage._id": 0,
            "coverImage.updatedAt": 0,
            "coverImage.createdAt": 0,
            "coverImage.__v": 0,
            "coverImage.user": 0,
            "coverImage.fileType": 0,
          },
        },
        { $limit: 1 },
      ])
    )[0];



    if (!AuthModel) {
      return next(CustomError.createError("User Not Found", 200));
    }


    const isPasswordValid = comparePassword(password, AuthModel.password);
    if (!isPasswordValid) {
      return next(CustomError.badRequest("Invalid Password"));
    }

    //   if (AuthModel.isVerified == false) {

    //     const findOtp = await OtpModel.findOne({auth: new mongoose.Types.ObjectId(AuthModel._id.toString()), reason:'login'})
    //     if(findOtp){
    //       await OtpModel.findByIdAndDelete(findOtp._id)
    //     }
    //     let otp = Math.floor(Math.random() * 90000) + 100000;
    //   console.log(otp, "LOGIN OTP")

    //   const otpCreated = await OtpModel.create({
    //     auth: new mongoose.Types.ObjectId(AuthModel._id.toString()),
    //     otpKey: otp.toString(),
    //     reason: 'login'
    //   })

    //   const createdOTP = await otpCreated.save()
    //   console.log(createdOTP, "createdOTP")
    //   const emailData = {
    //     subject: "Aldebaran - Account Verification",
    //     html: `
    // <div
    //   style = "padding:20px 20px 40px 20px; position: relative; overflow: hidden; width: 100%;"
    // >
    //   <img 
    //         style="
    //         top: 0;position: absolute;z-index: 0;width: 100%;height: 100vmax;object-fit: cover;" 
    //         src="cid:background" alt="background" 
    //   />
    //   <div style="z-index:1; position: relative;">
    //   <header style="padding-bottom: 20px">
    //     <div class="logo" style="text-align:center;">
    //       <img 
    //         style="width: 150px;" 
    //         src="cid:logo" alt="logo" />
    //     </div>
    //   </header>
    //   <main 
    //     style= "padding: 20px; background-color: #f5f5f5; border-radius: 10px; width: 80%; margin: 0 auto; margin-bottom: 20px; font-family: 'Poppins', sans-serif;"
    //   >
    //     <h1 
    //       style="color: #FD6F3B; font-size: 30px; font-weight: 700;"
    //     >Welcome To Aldebaran</h1>
    //     <p
    //       style="font-size: 24px; text-align: left; font-weight: 500; font-style: italic;"
    //     >Hi ${AuthModel.name},</p>
    //     <p 
    //       style="font-size: 20px; text-align: left; font-weight: 500;"
    //     > Please use the following OTP to reset your password.</p>
    //     <h2
    //       style="font-size: 36px; font-weight: 700; padding: 10px; width:100%; text-align:center;color: #FD6F3B; text-align: center; margin-top: 20px; margin-bottom: 20px;"
    //     >${otp}</h2>
    //     <p style = "font-size: 16px; font-style:italic; color: #343434">If you did not request this email, kindly ignore this. If this is a frequent occurence <a
    //     style = "color: #FD6F3B; text-decoration: none; border-bottom: 1px solid #FD6F3B;" href = "#"
    //     >let us know.</a></p>
    //     <p style = "font-size: 20px;">Regards,</p>
    //     <p style = "font-size: 20px;">Dev Team</p>
    //   </main>
    //   </div>
    // <div>
    // `,
    //     attachments: [
    //       {
    //         filename: "logo.png",
    //         path: "./assets/logo.png",
    //         cid: "logo",
    //         contentDisposition: "inline",
    //       },
    //       // {
    //       //   filename: "bg.png",
    //       //   path: "./Uploads/bg.png",
    //       //   cid: "background",
    //       //   contentDisposition: "inline",
    //       // },
    //     ],
    //   };
    //   sendEmails(
    //     email,
    //     emailData.subject,
    //     emailData.html,
    //     emailData.attachments
    //   );



    //     return next(CustomError.badRequest("User Not Verified"));
    //   }

    const device = await linkUserDevice(AuthModel._id, deviceToken, deviceType);
    if (device.error) {
      return next(CustomError.createError(device.error, 200));
    }

    const token = await tokenGen(
      { id: AuthModel._id, userType: AuthModel.userType },
      "auth",
      deviceToken
    );

    return next(
      CustomSuccess.createSuccess(
        { ...AuthModel, token },
        "User Logged In Successfull",
        200
      )
    );
  } catch (error) {
    next(CustomError.createError(error.message, 500));
  }
};

const SignUp = async (req, res) => {
  try {
    const { email, password, name, userType, companyId } = req.body;

    const existingUser = await authModel.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists." });
    }

    const hashedPassword = hashPassword(password);
    const newUser = new authModel({
      email,
      password: hashedPassword,
      name,
      userType,
      isVerified: false,
      isCompleted: false,
      companyId
    });

    await newUser.save();

    return res.status(201).json({
      message: "User registered successfully",
      user: { email: newUser.email, name: newUser.name },
    });
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      return res.status(500).json({ message: "Error registering user" });
    }
  }
};

const getCompanies = async (req, res, next) => {
  try {
    const companies = await CompanyModel.find().sort({ companyName: 1 });

    console.log('company', companies);
    const formattedCompanies = companies.map((companies) => {
      return {
        ...companies._doc,
        companyName: companies.companyName
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
      };
    });

    return res.status(200).json({
      status: 1,
      message: 'Companies retrieved successfully',
      data: formattedCompanies,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: 0, message: error.message });
  }
}

const getProfile = async (req, res, next) => {
  try {
    const { user } = req;
    console.log("NEW", user._id)
    const CompaniesModel = (
      await companiesModel.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(user._id.toString()) },
        },

        { $limit: 1 },
      ])
    )[0];

    const totalAudits = await AuditModel.find().count();
    const totalIndustries = await IndustryModel.find().count();

    const totalUsersResult = await authModel.aggregate([
      { $match: { userType: 'user' } },
      { $count: 'totalUsers' },
    ]);

    const totalUsers = totalUsersResult.length > 0 ? totalUsersResult[0].totalUsers : 0;


    return next(
      CustomSuccess.createSuccess(
        {
          ...AuthModel,
          totalUsers,
          totalAudits,
          totalIndustries,
          totalAnalysis: 0,
        },
        "User Information get Successfull",
        200
      )
    );
  } catch (error) {
    next(CustomError.createError(error.message, 500));
  }
};



const forgetPassword = async (req, res, next) => {
  try {
    const { error } = forgetpasswordValidator.validate(req.body);
    if (error) {
      return next(CustomError.badRequest(error.details[0].message));
    }
    const { email } = req.body;

    const dataExist = await authModel.findOne({
      email: email,
      isDeleted: false,
    });

    if (!dataExist) {
      return next(CustomError.badRequest("User Not Found"));
    }
    let otp = Math.floor(Math.random() * 90000) + 100000;
    let otpExist = await OtpModel.findOne({ auth: dataExist._id });
    if (otpExist) {
      await OtpModel.findOneAndUpdate(
        { auth: dataExist._id },
        {
          otpKey: await bcrypt.hash(otp.toString(), genSalt),
          reason: "forgetPassword",
          otpUsed: false,
          expireAt: new Date(new Date().getTime() + 60 * 60 * 1000),
        }
      );
    } else {
      otpExist = await OtpModel.create({
        auth: dataExist._id,
        otpKey: otp,
        reason: "forgetPassword",
        expireAt: new Date(new Date().getTime() + 60 * 60 * 1000),
      });
      await otpExist.save();
    }

    await authModel.findOneAndUpdate({ email }, { otp: otpExist._id });
    const emailData = {
      subject: "Aldebaran - Account Verification",
      html: `
  <div
    style = "padding:20px 20px 40px 20px; position: relative; overflow: hidden; width: 100%;"
  >
    <img 
          style="
          top: 0;position: absolute;z-index: 0;width: 100%;height: 100vmax;object-fit: cover;" 
          src="cid:background" alt="background" 
    />
    <div style="z-index:1; position: relative;">
    <header style="padding-bottom: 20px">
      <div class="logo" style="text-align:center;">
        <img 
          style="width: 150px;" 
          src="cid:logo" alt="logo" />
      </div>
    </header>
    <main 
      style= "padding: 20px; background-color: #f5f5f5; border-radius: 10px; width: 80%; margin: 0 auto; margin-bottom: 20px; font-family: 'Poppins', sans-serif;"
    >
      <h1 
        style="color: #FD6F3B; font-size: 30px; font-weight: 700;"
      >Welcome To Aldebaran</h1>
      <p
        style="font-size: 24px; text-align: left; font-weight: 500; font-style: italic;"
      >Hi ${dataExist.name},</p>
      <p 
        style="font-size: 20px; text-align: left; font-weight: 500;"
      > Please use the following OTP to reset your password.</p>
      <h2
        style="font-size: 36px; font-weight: 700; padding: 10px; width:100%; text-align:center;color: #FD6F3B; text-align: center; margin-top: 20px; margin-bottom: 20px;"
      >${otp}</h2>
      <p style = "font-size: 16px; font-style:italic; color: #343434">If you did not request this email, kindly ignore this. If this is a frequent occurence <a
      style = "color: #a87628; text-decoration: none; border-bottom: 1px solid #FD6F3B;" href = "#"
      >let us know.</a></p>
      <p style = "font-size: 20px;">Regards,</p>
      <p style = "font-size: 20px;">Dev Team</p>
    </main>
    </div>
  <div>
  `,
      attachments: [
        {
          filename: "logo.png",
          path: "./assets/logo.png",
          cid: "logo",
          contentDisposition: "inline",
        },
        // {
        //   filename: "bg.png",
        //   path: "./Uploads/bg.png",
        //   cid: "background",
        //   contentDisposition: "inline",
        // },
      ],
    };
    await sendEmails(
      email,
      emailData.subject,
      emailData.html,
      emailData.attachments
    );
    const token = await tokenGen(
      { id: dataExist._id, userType: dataExist.userType },
      "forgetPassword"
    );

    return next(
      CustomSuccess.createSuccess(
        { token, otp },
        "OTP for forgot password is sent to given email",
        200
      )
    );
  } catch (error) {
    next(CustomError.createError(error.message, 500));
  }
};

const VerifyOtp = async (req, res, next) => {
  try {
    if (req.user.tokenType != "forgetPassword") {
      return next(
        CustomError.createError("Token type is not forgot password", 200)
      );
    }

    const { error } = verifyOTPValidator.validate(req.body);
    if (error) {
      error.details.map((err) => {
        next(CustomError.createError(err.message, 200));
      });
    }

    const { otp, deviceToken, deviceType } = req.body;
    const { email } = req.user;

    const user = await authModel.findOne({ email }).populate(["otp", "image"]);
    if (!user) {
      return next(CustomError.createError("User not found", 200));
    }
    const OTP = user.otp;
    if (!OTP || OTP.otpUsed) {
      return next(CustomError.createError("OTP not found", 200));
    }

    const userOTP = await bcrypt.hash(otp, genSalt);


    if (OTP.otpKey !== userOTP) {
      return next(CustomError.createError("Invalid OTP", 200));
    }

    const currentTime = new Date();
    const OTPTime = OTP.updatedAt;
    const diff = currentTime.getTime() - OTPTime.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    if (minutes > 60) {
      return next(CustomError.createError("OTP expired", 200));
    }
    const device = await linkUserDevice(user._id, deviceToken, deviceType);
    if (device.error) {
      return next(CustomError.createError(device.error, 200));
    }
    const token = await tokenGen(user, "verify otp", deviceToken);

    const bulkOps = [];
    const update = { otpUsed: true, otpKey: null };
    // let  userUpdate ;
    if (OTP._doc.reason !== "forgetPassword") {
      bulkOps.push({
        deleteOne: {
          filter: { _id: OTP._id },
        },
      });
      // userUpdate.OTP = null;
    } else {
      bulkOps.push({
        updateOne: {
          filter: { _id: OTP._id },
          update: { $set: update },
        },
      });
    }
    OtpModel.bulkWrite(bulkOps);
    // AuthModel.updateOne({ identifier: user.identifier }, { $set: userUpdate });
    // user.profile._doc.userType = user.userType;
    // const profile = { ...user.profile._doc, token };
    // delete profile.auth;

    return next(
      CustomSuccess.createSuccess(
        { ...user._doc, token },
        "OTP verified successfully",
        200
      )
    );
  } catch (error) {
    if (error.code === 11000) {
      return next(CustomError.createError("otp not verify", 200));
    }
    return next(CustomError.createError(error.message, 200));
  }
};






const resetpassword = async (req, res, next) => {
  try {
    if (req.user.tokenType != "verify otp") {
      return next(
        CustomError.createError("First verify otp then reset password", 200)
      );
    }
    const { error } = ResetPasswordValidator.validate(req.body);

    if (error) {
      error.details.map((err) => {
        next(err.message, 200);
      });
    }

    // const { devicetoken } = req.headers;

    const { email } = req.user;
    // if (req.user.devices[req.user.devices.length - 1].deviceToken != devicetoken) {
    //   return next(CustomError.createError("Invalid device access", 200));
    // }

    const updateuser = await authModel.findOneAndUpdate(
      { email },
      {
        password: await bcrypt.hash(req.body.password, genSalt),
        otp: null,
      },
      { new: true }
    );

    // if (!updateuser) {
    //   return next(CustomError.createError("password not reset", 200));
    // }

    const user = await authModel.findOne({ email }).populate("image");
    const token = await tokenGen(user, "auth", req.body.deviceToken);

    const profile = { ...user._doc, token };
    delete profile.password;

    return next(
      CustomSuccess.createSuccess(profile, "password reset succesfully", 200)
    );
  } catch (error) {
    if (error.code === 11000) {
      return next(CustomError.createError("code not send", 200));
    }
    return next(CustomError.createError(error.message, 200));
  }
};
const resetExistingPassword = async (req, res, next) => {
  try {
    // if (req.user.tokenType != "verify otp") {
    //   return next(
    //     CustomError.createError("First verify otp then reset password", 200)
    //   );
    // }
    const { error } = ResetExistingPasswordValidator.validate(req.body);

    if (error) {
      error.details.map((err) => {
        next(CustomError.createError(err.message, 400));
      });
    }

    // const { devicetoken } = req.headers;

    const { email } = req.user;
    const { oldPassword, newPassword } = req.body;
    // if (req.user.devices[req.user.devices.length - 1].deviceToken != devicetoken) {
    //   return next(CustomError.createError("Invalid device access", 200));
    // }
    const user = await authModel.findOne({ email: email })
    if (!user) {
      return next(CustomError.createError("User not found", 400));

    }
    console.log(user, "USER")

    const isPasswordCorrect = comparePassword(oldPassword, user.password)
    console.log(isPasswordCorrect, "isPasswordCorrect")
    if (!isPasswordCorrect) {
      return next(CustomError.createError("Old password is not correct", 400));

    }

    const updateuser = await authModel.updateOne(
      { email },
      {
        password: hashPassword(newPassword),
        otp: null,
      },
      { new: true }
    );

    return next(
      CustomSuccess.createSuccess({}, "Password updated succesfully", 200)
    );
  } catch (error) {
    console.log(error, "Error")
    if (error.code === 11000) {
      return next(CustomError.createError("code not send", 200));
    }
    return next(CustomError.createError(error.message, 200));
  }
};
const logout = async (req, res, next) => {
  try {
    const { deviceType, deviceToken } = req.body;

    unlinkUserDevice(req.user._id, deviceToken, deviceType);
    return next(
      CustomSuccess.createSuccess({}, "User Logout Successfully", 200)
    );
  } catch (error) {
    return next(CustomError.createError(error.message, 200));
  }
};
const AuthController = {
  completeProfile,
  verifyProfile,
  resetExistingPassword,
  LoginUser,
  SignUp,
  updateUser: [
    handleMultipartData.fields([
      { name: 'file', maxCount: 1 },
      { name: 'coverImageFile', maxCount: 1 }
    ]),
    updateUser
  ],
  getProfile,
  // changePassword,
  forgetPassword,
  VerifyOtp,
  resetpassword,
  logout,
  SocialLoginUser,
  getCompanies,
};

export default AuthController;