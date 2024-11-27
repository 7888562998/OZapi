import mongoose from "mongoose";

const AuditSchema = new mongoose.Schema(
  {

    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "auth",
    },
    description: {
      type: String,
      required: false,
    },
    StartTime: {
      type: Date,
      required: true,
    },
    EndTime: {
      type: Date,
      required: true,
    },
    Documents: {
      type: [mongoose.Schema.Types.ObjectId],
      required: false,
      ref: "fileUpload",
    },
    Recording: {
      type: [mongoose.Schema.Types.ObjectId],
      required: false,
      ref: "fileUpload",
    },
    Notes: {
      type: String,
      required: false,
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
    PreauditID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "PreAudit",
    },
    Nonvalueadded: {
      enum: ['Behaviour', 'Skills', 'System', 'Technical']
    }



  },
  {
    timestamps: true,
  }
);

const AuditModel = mongoose.model("Audit", AuditSchema);

export default AuditModel;
