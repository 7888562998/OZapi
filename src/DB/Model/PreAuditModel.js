import mongoose from "mongoose";

const PreAuditSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "auth",
    },
    // description: {
    //   type: String,

    //   lowercase: false
    // },
    ActivityID: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "Activity",
    },
    caseNumber: {
      type: Number,
    },

    startTime:{
      type: Date,
      required: true,
    },
    endTime:{
      type: Date,
      required: true,
    },
    totalPercentage: {
      type: Number,
      default: 0,
    }
    // EstimatedPer:{
    //   type: String,
    //   required: true,
    //   default: '100%'
    // },
  },
  {
    timestamps: true,
  }
);

const PreAuditModel = mongoose.model("PreAudit", PreAuditSchema);

export default PreAuditModel;
