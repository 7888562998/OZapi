import authModel from "../DB/Model/authModel.js";
import IndustryModel from "../DB/Model/industryModel.js";
import CustomError from "../Utils/ResponseHandler/CustomError.js";
import CustomSuccess from "../Utils/ResponseHandler/CustomSuccess.js";
import RoleModel from "../DB/Model/roleModel.js";
import ActivityModel from "../DB/Model/activityModel.js";
import { comparePassword, hashPassword } from "../Utils/SecuringPassword.js";
import { sendEmails } from "../Utils/SendEmail.js";

import {
  IdValidator,
  RegisterUserValidator,
} from "../Utils/Validator/UserValidator.js";
import {
  designationValidator,
  notificationValidator,
} from "../Utils/Validator/adminvalidator.js";


import push_notifications from "../Config/push_notification.js";
import CaseNumberModel from "../DB/Model/caseNumber.js";
import PreAuditModel from "../DB/Model/PreAuditModel.js";
import AuditModel from "../DB/Model/AuditModel.js";
import NonValueActivtyModel from "../DB/Model/NonValueActivity.js";
import mongoose from "mongoose";
import DeviceModel from "../DB/Model/deviceModel.js";
import NotificationsModel from "../DB/Model/notificationModal.js";
import FCM from 'fcm-node'

var serverKey =
  'AAAAg9_ecAA:APA91bEoiQ3_ZmYtiBVh31afT9CdRKRLJnOGo1odJGep_xfE6sPmEsa1O5xL05OvTpy6doi6wKNUPqdCcB5IsoEpqg9n51FbdqjzoBrS1xHjw69Uqg4Swa4tI7A2pGy8whYO9SZ6cVuE'

var fcm = new FCM(serverKey)




const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      industry,
      role
    } = req.body;

    const findUser = await authModel.findOne({ email });

    if (findUser) {
      return res.status(400).json({
        status: 0,
        message: 'User with the same email already exists',
      });
    }
    const password = hashPassword('12345678')

    const User = new authModel({
      name,
      email,
      industry,
      role,
      password: password
    });

    await User.save();

    const emailData = {
      subject: "Aldebaran - Account Created",
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
      > Please use the following password to login your account.</p>
      <h2
        style="font-size: 36px; font-weight: 700; padding: 10px; width:100%; text-align:center;color: #FD6F3B; text-align: center; margin-top: 20px; margin-bottom: 20px;"
      >12345678</h2>
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
      ],
    };

    sendEmails(
      email,
      'New Account',
      emailData.html,
      emailData.attachments
    );



    return res.status(201).json({
      status: 1,
      message: 'User created successfully',
      data: User,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: 0, message: error.message });
  }
};



const createIndustry = async (req, res) => {
  try {
    const { title } = req.body;

    const existingIndustry = await IndustryModel.findOne({ title });

    if (existingIndustry) {
      return res.status(400).json({
        status: 0,
        message: 'Industry with the same title already exists',
      });
    }

    const Industry = new IndustryModel({ title });

    await Industry.save();

    return res.status(201).json({
      status: 1,
      message: 'Industry created successfully',
      data: Industry,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: 0, message: error.message });
  }
};



const createRoles = async (req, res) => {
  try {
    const { title, IndustryID, Cost } = req.body;

    const createRole = await RoleModel.create({ title, IndustryID, Cost });




    return res.status(201).json({
      status: 1,
      message: 'Role created successfully',
      data: createRole,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: 0, message: error.message });
  }
};



const createActivity = async (req, res) => {
  try {
    const { title, IndustryID, RoleID,Cost } = req.body;

    const createActivity = await ActivityModel.create({ title, IndustryID, RoleID,Cost });




    return res.status(201).json({
      status: 1,
      message: 'Activity created successfully',
      data: createActivity,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: 0, message: error.message });
  }
};


const getActivitybyRoles = async (req, res) => {
  try {
    const { IndustryID, RoleID } = req.body;

    const getActivity = await ActivityModel.find({ RoleID, IndustryID }).sort({ title: 1 });

    const formattedGetActivity = getActivity.map((industry) => {
      return {
        ...industry._doc,
        title: industry.title
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
      };
    });


    return res.status(201).json({
      status: 1,
      message: 'Activity Retrived successfully',
      data: formattedGetActivity,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: 0, message: error.message });
  }
};

const getAllActivities = async (req, res) => {
  try {


    const { limit = 10, offset = 0, search = "", sort = "asc", sortField = "createdAt" } = req.query

    const [countResult, activities] = await Promise.allSettled([
      ActivityModel.countDocuments({ title: { $regex: search, $options: "i" } }),
      ActivityModel.find({ title: { $regex: search, $options: "i" } }).populate('IndustryID').populate("RoleID").sort({ [sortField]: sort }).skip(offset).limit(limit)
    ]);

    return res.status(201).json({
      activities: activities.value,
      count: countResult.value,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: 0, message: error.message });
  }
};






const getAllIndustries = async (req, res) => {
  try {

    const { limit = 10, offset = 0, search = "", sort = "asc", sortField = "createdAt" } = req.query

    const [countResult, industries] = await Promise.allSettled([
      IndustryModel.countDocuments({ title: { $regex: search, $options: "i" } }),
      IndustryModel.find({ title: { $regex: search, $options: "i" } }).sort({ [sortField]: sort }).skip(offset).limit(limit)
    ]);

    console.log(industries, "Industries")


    // Return the response directly
    res.status(201).json({
      industries: industries.value,
      count: countResult.value,
    });

  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: 0, message: error.message });
  }
};

const getIndustries = async (req, res) => {
  try {
    const Industries = await IndustryModel.find().sort({ title: 1 });

    const formattedIndustries = Industries.map((industry) => {
      return {
        ...industry._doc,
        title: industry.title
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
      };
    });

    return res.status(200).json({
      status: 1,
      message: 'Industries retrieved successfully',
      data: formattedIndustries,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: 0, message: error.message });
  }
}



const getAllRoles = async (req, res) => {
  try {
    const { limit = 10, offset = 0, search = "", sort = "asc", sortField = "createdAt" } = req.query

    const [countResult, roles] = await Promise.allSettled([
      RoleModel.countDocuments({ title: { $regex: search, $options: "i" } }),
      RoleModel.find({ title: { $regex: search, $options: "i" } }).sort({ [sortField]: sort }).populate('IndustryID').skip(offset).limit(limit)
    ]);

    // Return the response directly
    res.status(201).json({
      roles: roles.value,
      count: countResult.value,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: 0, message: error.message });
  }
};

const getRolesbyID = async (req, res) => {
  try {
    const { IndustryID } = req.body
    const Roles = await RoleModel.find({ IndustryID }).populate('IndustryID').sort({ title: 1 });
    const formattedRoles = Roles.map((role) => {
      return {
        ...role._doc,
        title: role.title
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
      };
    });
    return res.status(200).json({
      status: 1,
      message: 'Roles retrieved successfully',
      data: formattedRoles,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: 0, message: error.message });
  }
};

// @Desc: Send Notifications
// @EndPoint: /admin/notification
// @Access: Private
export const sendNotifications = async (req, reply) => {
  try {
    const { ids: userIds, type, title, description } = req.body
    console.log('user Ids->', { userIds })

    if (!title) {

      return reply.send(CustomError.createError('Title is required', 400))

    }


    if (type === 'All') {
      const fetchUserTokens = await DeviceModel
        .aggregate([
          {
            $lookup: {
              from: 'auths',
              localField: 'user',
              foreignField: '_id',
              as: 'user',

            },
          },

          {
            $match: {
              'user.0': { $exists: true }, // Ensure user exists
              'user.notificationOn': true // Condition for notifications
            }
          },

          {
            $project: {
              _id: 1,
              "user._id": 1
            },
          },
          { $count: "total" }
        ]).exec()
      const fetchAllToken = fetchUserTokens.length > 0 ? fetchUserTokens[0].total : 0

      const divideTotal = fetchAllToken / 500
      const divideResult = Math.ceil(divideTotal)
      console.log(divideResult, "Devices count")

      for (let i = 0; i < divideResult; i++) {
        const value = i * 500

        const fetchAllTokenWithSkip = await DeviceModel
          .aggregate([
            {
              $lookup: {
                from: 'auths',
                localField: 'userId',
                foreignField: '_id',
                as: 'user',

              },
            },

            {
              $match: {
                'user.0': { $exists: true }, // Ensure user exists
                'user.notificationOn': true // Condition for notifications
              }
            },

            {
              $project: {
                _id: 1,
                deviceToken: 1
              },
            },
            {
              $limit: 500,

            },
            {
              $skip: value
            }

          ]).exec()

        const arrayOfDevice = fetchAllTokenWithSkip.map((obj) => obj.deviceToken)
        const message = {
          registration_ids: arrayOfDevice,
          notification: {
            title: title,
            body: description,
          },
        }

        console.log(message)

        fcm.send(message, async function (err, response) {
          if (err) {
            console.log('Something has gone wrong!', err)
          } else {
          }
          const createNotification = await NotificationsModel.create({
            userId: null,
            title: title,
            description: description,
            type: "All"
          })
          console.log('Successfully sent with response:', response)
        })
      }
    } else {
      if (userIds.length == 0) {
        return reply.send(CustomError.createError('User IDs length must be greater than 0', 400))
      }


      if (userIds.length > 100) {
        return reply.send(CustomError.createError('User IDs length must be less than or equal to 100', 400))
      }
      const fetchAllToken = await DeviceModel
        .aggregate([
          {
            $lookup: {
              from: 'auths',
              localField: 'userId',
              foreignField: '_id',
              as: 'user',

            },
          },

          {
            $match: {
              'user.0': { $exists: true }, // Ensure user exists
              'user.notificationOn': true, // Condition for notifications
              userId: { $in: userIds.map((el) => new mongoose.Types.ObjectId(el)) },
            }
          },


          {
            $project: {
              _id: 1,
              deviceToken: 1
            },
          }


        ]).exec()





      const arrayOfDevice = fetchAllToken.map((obj) => obj.deviceToken)
      const message = {
        registration_ids: arrayOfDevice,
        notification: {
          title: title,
          body: description,
        },
      }

      console.log(message)

      fcm.send(message, async function (err, response) {
        if (err) {
          console.log('Something has gone wrong!', err)
        } else {
        }
        const Notifications = userIds.map((el) => {
          return {
            userId: el,
            title: title,
            description: description,
            type: "Few"
          }
        })
        const createNotification = await NotificationsModel.insertMany(Notifications)
        console.log('Successfully sent with response:', response)
      })



    }


    return reply.send(
      CustomSuccess.createSuccess({}, 'Notification created successfully', 200),
    )
  } catch (error) {
    logger.error(error)
    console.error(error)
    return reply.send(CustomError.createError(error.message, 500))
  }
}













const SendNotification = async (req, res, next) => {
  try {
    const { error } = notificationValidator.validate(req.body);
    if (error) {
      return next(CustomError.badRequest(error.details[0].message));
    }
    const { userId, allUser, title, body } = req.body;
    var data = [];
    if (allUser) {
      data = [...(await authModel.find({}).populate("devices"))];
    } else {
      data = [
        ...(await authModel.find({ _id: { $in: userId } }).populate("devices")),
      ];
    }
    console.log(data);
    data.map((item) => {
      item.devices.map(async (item2) => {
        await push_notifications({
          deviceToken: item2.deviceToken,
          title,
          body,
        });
      });
    });
    return next(
      CustomSuccess.createSuccess({}, "Notification Sent successfully", 200)
    );
  } catch (error) {
    return next(CustomError.badRequest(error.message));
  }
};




const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Update the fields: isDeleted = true, notificationOn = false
    const updatedUser = await authModel.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        notificationOn: false,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (err) {
    // Handle the error
    return res.status(500).json({
      success: false,
      message: "Failed to update user status",
      error: err.message,
    });
  }
};

// const deleteRole = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     // Update the fields: isDeleted = true, notificationOn = false
//     const updatedUser = await authModel.findByIdAndUpdate(
//       id,
//       {
//         isDeleted: true,
//         notificationOn: false,
//       },
//       { new: true }
//     );

//     if (!updatedUser) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: updatedUser,
//     });
//   } catch (err) {
//     // Handle the error
//     return res.status(500).json({
//       success: false,
//       message: "Failed to update user status",
//       error: err.message,
//     });
//   }
// };
// const deleteActivity = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     // Update the fields: isDeleted = true, notificationOn = false
//     const updatedUser = await authModel.findByIdAndUpdate(
//       id,
//       {
//         isDeleted: true,
//         notificationOn: false,
//       },
//       { new: true }
//     );

//     if (!updatedUser) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: updatedUser,
//     });
//   } catch (err) {
//     // Handle the error
//     return res.status(500).json({
//       success: false,
//       message: "Failed to update user status",
//       error: err.message,
//     });
//   }
// };





const getAllUsers = async (req, res, next) => {
  try {
    const { limit = 10, offset = 0, search = '', sort = 'asc', sortField = 'createdAt' } = req.query;

    const [countResult, users] = await Promise.allSettled([
      authModel.countDocuments({ email: { $regex: search, $options: "i" } }),
      authModel.find({ email: { $regex: search, $options: "i" } }).sort({ [sortField]: sort }).select("-password").populate("image").skip(offset).limit(limit)
    ]);

    // Return the response directly
    res.status(201).json({
      users: users.value,
      count: countResult.value,
      // current_page: page
    });

  } catch (error) {
    // Pass the error to the next middleware
    next(error);
  }
};
const getAllCases = async (req, res, next) => {
  try {
    const { limit = 10, offset = 0, sort = 'asc', sortField = 'createdAt' } = req.query;

    const [countResult, cases] = await Promise.allSettled([
      CaseNumberModel.countDocuments(),
      CaseNumberModel.find().sort({ [sortField]: sort }).skip(offset).limit(limit)
    ]);




    // Return the response directly
    res.status(201).json({
      cases: cases.value,
      count: countResult.value,
      // current_page: page
    });

  } catch (error) {
    // Pass the error to the next middleware
    next(error);
  }
};
const getUserCases = async (req, res) => {




  try {

    const { id } = req.params
    const { limit = 10, offset = 0, sort = 'asc', sortField = 'createdAt' } = req.query;
    console.log(id, "ID")
    const cases = await PreAuditModel.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(id.toString()) } },
      { $group: { _id: { caseNumber: "$caseNumber" } } },
      {
        $project: {
          _id: 0,
          case: "$_id.caseNumber",
        },
      },
    ])
    console.log(cases, "cases")
    const caseIDS = cases.map((el) => el.case);
    console.log(caseIDS, "Case IDS")
    const [countResult, userCases] = await Promise.allSettled([
      CaseNumberModel.countDocuments({ caseNumber: { $in: caseIDS } }),
      CaseNumberModel.find({ caseNumber: { $in: caseIDS } }).sort({ [sortField]: sort }).skip(offset).limit(limit)
    ]);




    res.status(201).json({
      cases: userCases.value,
      count: countResult.value,
      // current_page: page
    });



  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
const getCaseDetails = async (req, res, next) => {
  try {

    const { caseNumber } = req.query

    const userDetails = await PreAuditModel.findOne({ caseNumber: caseNumber }).populate('user', '_id email phone name notificationOn userType').select('user')
    const preAudits = await PreAuditModel.find({ caseNumber: caseNumber }).populate('ActivityID')
    const audits = await AuditModel.find({ caseNumber: caseNumber }).populate({ path: 'ActivityID' })
    const nonValueActivities = await NonValueActivtyModel.find({ caseNumber: caseNumber }).populate({ path: 'ActivityID', select: 'title' })
    const caseN = await CaseNumberModel.findOne({ caseNumber })



    // Return the response directly
    res.status(201).json({
      user: userDetails ? userDetails?.user : null,
      preAudits: preAudits,
      audits: audits,
      nonValueActivities: nonValueActivities,
      case: caseN
      // current_page: page
    });

  } catch (error) {
    // Pass the error to the next middleware
    next(error);
  }
};
const getUsersAnalytics = async (req, res, next) => {
  try {


    const users = await authModel.aggregate([
      /** group all docs & sum-up question count using `$size` on array */
      {
        $group: {
          _id: { createdAt: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: "$_id.createdAt",
          count: 1
        },
      },

    ])


    // Return the response directly
    res.status(201).json({
      data: users,

      // current_page: page
    });

  } catch (error) {
    // Pass the error to the next middleware
    next(error);
  }
};
const getDashboardKpis = async (req, res, next) => {
  try {


    const users = await authModel.countDocuments({ userType: 'user' });
    const devices = await DeviceModel.countDocuments();
    const Industries = await IndustryModel.countDocuments();



    // Return the response directly
    res.status(201).json({
      users,
      devices,
      Industries

      // current_page: page
    });

  } catch (error) {
    // Pass the error to the next middleware
    next(error);
  }
};





const AdminController = {
  getAllUsers,
  deleteUser,
  SendNotification,
  sendNotifications,
  createIndustry,
  getAllIndustries,
  createUser,
  createRoles,
  createActivity,
  getAllRoles,
  getActivitybyRoles,
  getRolesbyID,
  getAllActivities,
  getAllCases,
  getCaseDetails,
  getUsersAnalytics,
  getUserCases,
  getDashboardKpis,
  getIndustries
};

export default AdminController;
