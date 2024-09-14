
import mongoose from "mongoose";

const SubActivitySchema = new mongoose.Schema(
  {
    item:[{type:Object}],
    ActivityID:{
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "activity",
  },
  user:{
    type: mongoose.Schema.Types.ObjectId,
    ref:'auth'
  }
  },

);

const SubActivityModel = mongoose.model("subactivity", SubActivitySchema);

export default SubActivityModel;

