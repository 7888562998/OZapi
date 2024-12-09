import mongoose from "mongoose";

const ActivitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      unique: true,
      lowercase: true,
    },
    IndustryID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Industry",
    },
    RoleID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "roles",
    },
    Cost: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0.0,
    },
  },
  {
    timestamps: true,
  }
);

const ActivityModel = mongoose.model("Activity", ActivitySchema);

export default ActivityModel;
