import mongoose from "mongoose";

const RoleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      unique: true,
      lowercase: true
    },
    IndustryID:{
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Industry",
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

const RoleModel = mongoose.model("roles", RoleSchema);

export default RoleModel;
