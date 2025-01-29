import fs from "fs";
import bcrypt, { compare } from "bcrypt";
import authModel from "../DB/Model/authModel.js";
import fileUploadModel from "../DB/Model/fileUploadModel.js";
import imagesUploadModel from "../DB/Model/imagesUploadModel.js";
import { handleMultipartData } from "../Utils/MultipartData.js";
import CustomError from "../Utils/ResponseHandler/CustomError.js";
import CustomSuccess from "../Utils/ResponseHandler/CustomSuccess.js";
import { comparePassword, hashPassword } from "../Utils/SecuringPassword.js";
import { sendEmails } from "../Utils/SendEmail.js";
import { mongoose } from "mongoose";
import { accessTokenValidator } from "../Utils/Validator/accessTokenValidator.js";
import NotificationController from "./NotificationController.js";
import jwt from "jsonwebtoken";
import format from 'pg-format';

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
import companyModel from "../DB/Model/companyModel.js";
import UserIndustryModel from "../DB/Model/userIndustryModel.js";
import { pool } from "../DB/PGSql/index.js";

const SocialLoginUser = async (req, res, next) => {
  try {
    const { deviceToken, deviceType, accessToken, socialType, userType } =
      req.body;
    const { hasError, message, data } = await accessTokenValidator(
      accessToken,
      socialType
    );
    if (hasError) {
      return next(CustomError.createError(message, 200));
    }
    const { name, image, identifier, dateOfBirth, gender } = data;

    const authmodel = await AuthModel.findOne({
      identifier: identifier,
    }).populate("profile");
    if (authmodel) {
      var UserProfile;

      if (authmodel.userType == "Customer") {
        const CustomerProfile = await CustomerModel.find({
          auth: authmodel._id,
        }).populate({
          path: "profile",
        });

        CustomerProfile.isCompleteProfile = authmodel.isCompleteProfile;

        const token = await tokenGen(CustomerProfile, "auth", deviceToken);
        // UserProfile = otpResource.BusinessWithToken(CustomerProfile, token);
        UserProfile = { ...CustomerProfile, token };
      }
      if (authmodel.userType == "Instructor") {
        const InstructorProfile = await InstructorModel.find({
          auth: authmodel._id,
        }).populate({
          path: "profile",
        });
        InstructorProfile.isCompleteProfile = authmodel.isCompleteProfile;
        const token = await tokenGen(InstructorProfile, "auth", deviceToken);
        // UserProfile = otpResource.WorkerWithToken(InstructorProfile, token);
        UserProfile = { ...InstructorProfile, token };
      }

      const { error } = await linkUserDevice(
        authmodel._id,
        deviceToken,
        deviceType
      );
      if (error) {
        return next(CustomError.createError(error, 200));
      }
      const respdata = {
        _id: UserProfile._id,
        fullName: UserProfile.fullName,
        follower:
          UserProfile.follower.length > 0 ? UserProfile.follower.length : 0,
        following:
          UserProfile.following.length > 0 ? UserProfile.following.length : 0,
        routine: UserProfile.routine,
        nutrition: UserProfile.nutrition,
        dietplane: UserProfile.dietplane,
        userType: authmodel.userType,
        image: await fileUploadModel.findOne(
          { _id: UserProfile.image },
          { file: 1 }
        ),
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

      return next(
        CustomSuccess.createSuccess(respdata, "SignUp successfully", 200)
      );
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
    console.log(User);
    if (!User) {
      return next(
        CustomError.badRequest("You are not registered please contact Admin")
      );
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
      name,
    };

    var token = jwt.sign({ userData: newUser, otp }, "secret"); //jwt.sign({userData:newUser , otp:userOTP} , 'secret' , {expiresIn:1})

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
    console.log(otp, "LOGIN OTP");
    const user = authModel.findOne({ email: email });
    if (!user) {
      return CustomError.createError("User not found", 400);
    }
    const otpCreated = OtpModel.create({
      auth: new mongoose.Types.ObjectId(user._id.toString()),
      otpKey: otp,
      reason: "login",
    });

    const createdOTP = await otpCreated.save();
    console.log(createdOTP, "createdOTP");

    await authModel.findOneAndUpdate(
      { email: email },
      {
        otp: otp,
      }
    );
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
    sendEmails(email, emailData.subject, emailData.html, emailData.attachments);

    //user creds

    return { otp };
  } catch (error) {
    return CustomError.createError(error.message, 500);
  }
};

const verifyProfile = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const userResult = await db.query('SELECT * FROM auths WHERE "email" = $1', [email]);
    const userData = userResult.rows[0];
    if (!userData) {
      return next(
        CustomError.badRequest("You are not registered, please contact Admin")
      );
    }

    const otpResult = await db.query(
      'SELECT * FROM Otps WHERE "auth" = $1 AND "otpUsed" = false AND "reason" = $2 LIMIT 1',
      [userData._id, 'login']
    );
    const findOTP = otpResult.rows[0];

    if (!findOTP) {
      return next(CustomError.badRequest("Invalid OTP"));
    }

    const decryptOTP = await bcrypt.compare(otp.toString(), findOTP.otpKey);

    if (!decryptOTP) {
      return next(CustomError.badRequest("Invalid OTP"));
    }

    const updateUserResult = await db.query(
      'UPDATE auths SET "isVerified" = true WHERE _id = $1 RETURNING *',
      [userData._id]
    );
    const updateUser = updateUserResult.rows[0];
    await db.query('DELETE FROM Otps WHERE _id = $1', [findOTP._id]);

    return next(
      CustomSuccess.createSuccess(
        { updateUser },
        "User Verified Successfully",
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
      Object.entries(req.body).filter(
        ([_, v]) => v != null && v !== "" && v !== "null"
      )
    );

    const { deviceToken } = req.headers;
    const { error } = updatevalidator.validate(data);
    if (error) {
      return next(CustomError.badRequest(error.details[0].message));
    }
    const { user } = req;

    if (!user) {
      return next(CustomError.badRequest("User Not Found"));
    }

    if (req.files["file"]) {
      const file = req.files["file"][0];

      if (user.image) {
        fs.unlinkSync(`Uploads/${user.image.file}`);
        await pool.query(
          "DELETE FROM file_uploads WHERE _id = $1",
          [user.image.id]
        );
      }

      const fileUploadResult = await pool.query(`INSERT INTO file_uploads (file, file_type, user_id) VALUES ($1, $2, $3) RETURNING id`,
        [file.filename, file.mimetype, user.id]
      );

      data.imageId = fileUploadResult.rows[0].id;
    }

    // Handle file upload for 'coverImageFile'
    if (req.files["coverImageFile"]) {
      const coverImageFile = req.files["coverImageFile"][0];

      if (user.coverImage) {
        // Delete old cover image file if exists
        fs.unlinkSync(`Uploads/${user.coverImage.file}`);
        await pool.query("DELETE FROM file_uploads WHERE _id = $1", [user.coverImage.id]);
      }

      const coverImageResult = await pool.query(`INSERT INTO file_uploads (file, file_type, user_id) VALUES ($1, $2, $3) RETURNING id`,
        [coverImageFile.filename, coverImageFile.mimetype, user.id]
      );
      data.coverImageId = coverImageResult.rows[0].id;
    }

    // Hash password if it's being updated
    if (data.password) {
      data.password = hashPassword(data.password);
    }

    const updateQuery = `UPDATE auths SET "isCompleted" = true,
    ${Object.keys(data).map((key, index) => `"${key}" = $${index + 1}`).join(", ")}
      WHERE _id = $${Object.keys(data).length + 1}
      RETURNING *;
    `;
    const updateParams = [...Object.values(data), user._id];
    const updatedUserResult = await pool.query(updateQuery, updateParams);

    if (updatedUserResult.rowCount === 0) {
      return next(CustomError.badRequest("User Not Found"));
    }

    const updatedUser = updatedUserResult.rows[0];
    const token = await tokenGen(
      { _id: updatedUser._id, userType: updatedUser.userType },  // User-specific info
      "auth",
      deviceToken  // Device token
    );

    return next(
      CustomSuccess.createSuccess(
        { ...updatedUser, token },
        "Profile updated successfully",
        200
      )
    );
  } catch (error) {
    console.error(error);
    next(CustomError.createError(error.message, 500));
  }
};


const updateUserMultipleImages = async (req, res, next) => {
  try {
    const { user } = req;
    const images = req.files["file"];

    if (!images || images.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const query = `
      INSERT INTO imageuploads ("user", "filePath", "fileType")
      VALUES %L
      RETURNING "user", "filePath", "fileType";
    `;

    const values = images.map((file) => [
      user._id,
      file.path,
      file.mimetype,
    ]);

    const formattedQuery = format(query, values);
    const result = await pool.query(formattedQuery);

    return next(
      CustomSuccess.createSuccess(
        { data: result.rows },
        "Images uploaded successfully",
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
    const query = `SELECT * FROM auths WHERE email = $1`;
    const result = await pool.query(query, [email]);
    if (result.rows.length === 0) {
      return next(CustomError.createError("User Not Found", 200));
    }

    const AuthModel = result.rows[0];
    const isPasswordValid = comparePassword(password, AuthModel.password);
    if (!isPasswordValid) {
      return next(CustomError.badRequest("Invalid Password"));
    }

    // const device = await linkUserDevice(AuthModel._id, deviceToken, deviceType);
    // console.log("device1234",device);
    // if (device.error) {
    //   return next(CustomError.createError(device.error, 200));
    // }

    const token = await tokenGen(
      { id: AuthModel._id, userType: AuthModel.userType },
      "auth",
      deviceToken
    );

    return next(
      CustomSuccess.createSuccess(
        { ...AuthModel, token },
        "User Logged In Successfully",
        200
      )
    );
  } catch (error) {
    next(CustomError.createError(error.message, 500));
  }
};


const SignUp = async (req, res, next) => {
  try {
    const { email, password, name, userType, companyId } = req.body;

    const checkUserQuery = `SELECT * FROM auths WHERE email = $1`;
    const checkUserResult = await pool.query(checkUserQuery, [email]);

    if (checkUserResult.rows.length > 0) {
      return next(
        CustomError.badRequest("User with this email already exists.")
      );
    }

    const hashedPassword = hashPassword(password);

    const insertUserQuery = `
    INSERT INTO auths (email, password, name, "userType", "isVerified", "isCompleted", "companyId")
    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
  `;

    const values = [
      email,
      hashedPassword,
      name,
      userType,
      false,
      false,
      companyId,
    ];
    const insertResult = await pool.query(insertUserQuery, values);

    const newUser = insertResult.rows[0];

    return next(
      CustomSuccess.createSuccess(
        { email: newUser.email, name: newUser.name },
        "User registered successfully",
        201
      )
    );
  } catch (error) {
    console.error(error);
    next(CustomError.createError(error.message, 500));
  }
};

const getCompanies = async (req, res, next) => {
  try {
    const companies = await CompanyModel.find().sort({ companyName: 1 });

    console.log("company", companies);
    const formattedCompanies = companies.map((companies) => {
      return {
        ...companies._doc,
        companyName: companies.companyName
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
      };
    });

    return res.status(200).json({
      status: 1,
      message: "Companies retrieved successfully",
      data: formattedCompanies,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: 0, message: error.message });
  }
};

const getProfile = async (req, res, next) => {
  try {
    const { user } = req;

    const authsQuery = `SELECT * FROM auths WHERE _id = $1`;
    const _id = user._id.toString();
    var AuthModel = await pool.query(authsQuery, [_id]);
    AuthModel = AuthModel.rows[0];

    const auditsQuery = `SELECT COUNT(*) FROM audits WHERE userid = $1`;
    const userid = user._id.toString();
    var totalAudits = await pool.query(auditsQuery, [userid]);
    totalAudits = totalAudits.rows[0].count;

    const companyQuery = `SELECT * FROM companies WHERE _id = $1`;
    var companyData = await pool.query(companyQuery, [AuthModel.companyId]);
    companyData = companyData.rows[0];

    const IndustriesQuery = `SELECT COUNT(*) FROM audits WHERE userid = $1`;
    var totalAudits = await pool.query(IndustriesQuery, [userid]);
    totalAudits = totalAudits.rows[0].count;

    const userindustryQuery = `SELECT COUNT(*) FROM userindustries WHERE userid = $1`;
    var totalIndustries = await pool.query(userindustryQuery, [userid]);
    totalIndustries = totalIndustries.rows[0].count;
    console.log(totalIndustries, "totalIndustries");

    // const totalUsersResult = await authModel.aggregate([
    //   { $match: { userType: "user" } },
    //   { $count: "totalUsers" },
    // ]);

    // const totalUsers =
    //   totalUsersResult.length > 0 ? totalUsersResult[0].totalUsers : 0;

    return next(
      CustomSuccess.createSuccess(
        {
          ...AuthModel,
          // totalUsers,
          totalAudits,
          totalIndustries,
          totalAnalysis: 0,
          companyName: companyData.companyName,
        },
        "User Information get Successfull",
        200
      )
    );
  } catch (error) {
    next(CustomError.createError(error.message, 500));
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    console.log("--email--, --role--", email, role);

    if (!email || !role) {
      return res.status(400).json({ message: "Email and role are required." });
    }

    // Check if user exists
    const existingUserQuery = "SELECT * FROM auths WHERE email = $1";
    const existingUserResult = await pool.query(existingUserQuery, [email]);

    if (existingUserResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const existingUser = existingUserResult.rows[0];
    console.log("existingUser", existingUser);

    const updateRoleQuery = "UPDATE auths SET role = $1 WHERE email = $2";
    await pool.query(updateRoleQuery, [role, email]);

    return next(
      CustomSuccess.createSuccess(
        {
          message: "Profile updated successfully",
          user: {
            email: existingUser.email,
            name: existingUser.name,
            role: role,
          },
        },
        "Profile updated successfully",
        200
      )
    );
  } catch (error) {
    next(CustomError.createError(error.message, 500));
  }
};

const createUserIndustry = async (req, res, next) => {
  try {
    const { email, industryId } = req.body;

    if (!email || !industryId) {
      return res
        .status(400)
        .json({ message: "Email and industryId are required." });
    }

    const userQuery = `SELECT * FROM auths WHERE email = $1`;
    var existingUser = await pool.query(userQuery, [email]);
    existingUser = existingUser.rows[0];

    const industryDataQuery = `SELECT * FROM industries WHERE _id = $1`;
    var industryData = await pool.query(industryDataQuery, [industryId]);
    industryData = industryData.rows[0];

    console.log(existingUser._id, industryId);
    const IndustryQuery = `SELECT * FROM userindustries WHERE userid = $1 and "industryId" = $2`;
    var existingIndustry = await pool.query(IndustryQuery, [
      existingUser._id,
      industryId,
    ]);
    existingIndustry = existingIndustry.rows;
    console.log(existingIndustry, "existingIndustry");

    if (!existingUser) {
      return res.status(404).json({ message: "User not found." });
    }

    if (existingIndustry.length > 0) {
      return res.status(409).json({ message: "Industry is already exist." });
    }

    const insertUserIndustriesQuery = `INSERT INTO userindustries (userid, "title", "industryId") VALUES ($1, $2, $3) RETURNING *;`;

    // Execute the query with the provided values
    const insertUserIndustries = await pool.query(insertUserIndustriesQuery, [
      existingUser._id, // Maps to `user` in the original MongoDB model
      industryData.title,
      industryId, // Ensure this matches the format expected in the database (e.g., UUID or integer)
    ]);
    console.log("insertUserIndustries", insertUserIndustries.rows[0]);

    return res.status(201).json({
      message: "Industry created successfully",
      user: { email: existingUser.email, name: existingUser.name },
      data: insertUserIndustries.rows[0],
    });
  } catch (error) {
    next(CustomError.createError(error.message, 500));
  }
};

const getUserIndustry = async (req, res) => {
  try {
    const userId = req.user._id;
    const query = `SELECT * FROM userindustries WHERE userid = $1`;
    const result = await pool.query(query, [userId])

    res.status(200).json({
      success: true,
      message: "Userindustries fetched successfully",
      data: result.rows,
    });
  } catch (error) {
    // Handle any errors
    res.status(500).json({
      success: false,
      message: "Failed to fetch Userindustries",
      error: error.message,
    });
  }
};

const getComapnyManager = async (req, res) => {
  try {
    const { companyId } = req.params;

    const authsQuery = `SELECT _id,name FROM auths WHERE "companyId" = $1 and role= $2`;

    var users = await pool.query(authsQuery, [companyId, "manager"]);
    users = users.rows;
    res.status(200).json({
      success: true,
      message: "Company manager fetched successfully",
      data: users,
    });
  } catch (error) {
    // Handle any errors
    res.status(500).json({
      success: false,
      message: "Failed to fetch company manager",
      error: error.message,
    });
  }
};
const forgetPassword = async (req, res, next) => {
  try {
    const { error } = forgetpasswordValidator.validate(req.body);
    if (error) {
      return next(CustomError.badRequest(error.details[0].message));
    }
    const { email } = req.body;

    // const dataExist = await authModel.findOne({
    //   email: email,
    //   isDeleted: false,
    // });
    // if (!dataExist) {
    //   return next(CustomError.badRequest("User Not Found"));
    // }

    var dataExist = await pool.query('SELECT * FROM auths WHERE email = $1 AND "isDeleted" = false', [email]);
    dataExist= dataExist.rows[0];
    if (!dataExist) {
      return next(CustomError.badRequest("User Not Found"));
    }

    // let otp = Math.floor(Math.random() * 90000) + 100000;
    // let otpExist = await OtpModel.findOne({ auth: dataExist._id });
    // if (otpExist) {
    //   await OtpModel.findOneAndUpdate(
    //     { auth: dataExist._id },
    //     {
    //       otpKey: await bcrypt.hash(otp.toString(), genSalt),
    //       reason: "forgetPassword",
    //       otpUsed: false,
    //       expireAt: new Date(new Date().getTime() + 60 * 60 * 1000),
    //     }
    //   );
    // } else {
    //   otpExist = await OtpModel.create({
    //     auth: dataExist._id,
    //     otpKey: otp,
    //     reason: "forgetPassword",
    //     expireAt: new Date(new Date().getTime() + 60 * 60 * 1000),
    //   });
    //   await otpExist.save();
    // }

    let otp = Math.floor(Math.random() * 90000) + 100000;

    // Check if OTP already exists for the user
    const otpExist = await pool.query('SELECT * FROM otps WHERE auth = $1', [dataExist.id]);
    
    if (otpExist.rows.length > 0) {
      await pool.query(
        'UPDATE otps SET "otpKey" = $1, "reason" = $2, "otpUsed" = false, "expireAt" = NOW() + INTERVAL \'1 hour\',"auth"=$4 WHERE _id = $3,',
        [await bcrypt.hash(otp.toString(), genSalt), 'forgetPassword', otpExist.rows[0].id,dataExist.id]
      );
    } else {
      const result = await pool.query(
        'INSERT INTO otps ("otpKey", auth, "reason", "expireAt") VALUES ($1, $2, $3, NOW() + INTERVAL \'1 hour\') RETURNING _id',
        [otp,dataExist.id, 'forgetPassword']
      );
    }

   // await authModel.findOneAndUpdate({ email }, { otp: otpExist._id });

   await pool.query('UPDATE auths SET "otp" = $1 WHERE email = $2', [otpExist._id, email]);

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

     sendEmails(
      email,
      emailData.subject,
      emailData.html,
      emailData.attachments
    );

    // const token = await tokenGen(
    //   { id: dataExist._id, userType: dataExist.userType },
    //   "forgetPassword"
    // );

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
    const { error } = ResetExistingPasswordValidator.validate(req.body);

    if (error) {
      error.details.map((err) => {
        next(CustomError.createError(err.message, 400));
      });
    }

    const { email } = req.user;
    const { oldPassword, newPassword } = req.body;
    const userQuery = 'SELECT * FROM auths WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return next(CustomError.createError('User not found', 400));
    }
    const user = userResult.rows[0];

    const isPasswordCorrect = comparePassword(oldPassword, user.password);
    if (!isPasswordCorrect) {
      return next(CustomError.createError("Old password is not correct", 400));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updateUserQuery = `
      UPDATE auths
      SET password = $1, otp = NULL, "updatedAt" = CURRENT_TIMESTAMP
      WHERE email = $2
      RETURNING _id, email, name;
    `;
    const updateResult = await pool.query(updateUserQuery, [hashedPassword, email]);
    const updatedUser = updateResult.rows[0];
    return next(
      CustomSuccess.createSuccess({}, "Password updated succesfully", 200)
    );
  } catch (error) {
    console.log(error, "Error");
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
      { name: "file", maxCount: 1 },
      { name: "coverImageFile", maxCount: 1 },
    ]),
    updateUser,
  ],
  updateUserMultipleImages: [
    handleMultipartData.fields([{ name: "file" }]),
    updateUserMultipleImages,
  ],
  getProfile,
  updateProfile,
  createUserIndustry,
  getUserIndustry,
  getComapnyManager,
  // changePassword,
  forgetPassword,
  VerifyOtp,
  resetpassword,
  logout,
  SocialLoginUser,
  getCompanies,
};

export default AuthController;
