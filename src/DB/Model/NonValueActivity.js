import mongoose from "mongoose";

const NonValueActivtySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      enum: ['Behaviour', 'Skills', 'System', 'Technical']
    },

    description: {
      type: String,
    },
    StartTime: {
      type: String,
      required: true,
    },
    EndTime: {
      type: String,
      required: true,
    },
    caseNumber: {
      type: Number,
      required: true,
    },
    ActivityID: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "Activity",
    },
  },
  {
    timestamps: true,
  }
);

const NonValueActivtyModel = mongoose.model("NonValueActivty", NonValueActivtySchema);

export default NonValueActivtyModel;
