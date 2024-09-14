import joi from "joi";
export const deviceRequired = {
  //test the given deviceToken
  deviceToken: joi.string().required(),
  deviceType: joi.string().required().equal("android", "ios", "postman"),
};
export const IdValidator = joi.object({
  id:joi.string().min(24)
  .max(24)
})
export const RegisterUserValidator = joi.object({
  email: joi.string().email().required(),
});
export const forgetpasswordValidator = joi.object({
  email: joi.string().email().required(),
});
export const LoginUserValidator = joi.object({
  email: joi.string().email().required(),
  password: joi.string().required(),
  deviceType: joi.string().required(),
  deviceToken: joi.string().required(),
});


export const changePasswordValidator = joi.object({
  old_password: joi.string().required(),
  new_password: joi.string().required(),
});

export const updatevalidator = joi.object({
  phone: joi.string().allow(null),
  location: joi.string().allow(null),
  // long:joi.number(),
  // lat:joi.number(),
  designation: joi.string().allow(null),
  password: joi.string().allow(null),
  name: joi.string().allow(null),
  notificationOn: joi.boolean(),
});

export const createprofilevalidator = joi.object({
  email: joi.string().required(),
  phone: joi.string().allow(null),
  location: joi.string().allow(null),
  //long:joi.number(),
 // lat:joi.number(),
  designation: joi.string().allow(null),
  password: joi.string().allow(null),
  name: joi.string().required(),
  deviceType: joi.string().required(),
  deviceToken: joi.string().required(),
});

export const verifyOTPValidator = joi.object({
  otp: joi.string().required(),
  ...deviceRequired,
});

export const ResetPasswordValidator = joi.object({
  password: joi.string().required(),
  ...deviceRequired,
  
});
export const ResetExistingPasswordValidator = joi.object({
  oldPassword: joi.string().required(),
  newPassword: joi.string().required(),
  
});


export const formValidator = joi.object({
  phone: joi.string().allow(null),
  name: joi.string().allow(null),
  email: joi.string().email().required(),
  message: joi.string().allow(null),
});