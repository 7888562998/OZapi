import mongoose from "mongoose";

const UserIndustrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    title: {
      type: String,
      unique: true,
      lowercase: true,
    },
    industryId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const UserIndustryModel = mongoose.model("UserIndustry", UserIndustrySchema);

export default UserIndustryModel;
