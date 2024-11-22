import mongoose from "mongoose";

const imagesUploadSchema = new mongoose.Schema(
  {
    files: [
      {
        filePath: {
          type: String,
          required: true,
        },
        fileType: {
          type: String,
          required: true,
        },
      },
    ],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "auth",
    },
  },
  {
    timestamps: true,
  }
);

const imagesUploadModel = mongoose.model("imagesUpload", imagesUploadSchema);

export default imagesUploadModel;
