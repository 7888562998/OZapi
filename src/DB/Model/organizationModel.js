import mongoose from "mongoose";

const IndustrySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      unique: true,
      lowercase: true
    },
  },
  {
    timestamps: true,
  }
);

const IndustryModel = mongoose.model("Industrys", IndustrySchema);

export default IndustryModel;
