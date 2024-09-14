import mongoose from "mongoose";

const RecordSchema = mongoose.Schema({
recordType:{
    type:String,
    enum:["skills","behaviour","attitude","nonvalue"],
    required:true
},
title:{
    type:String,
required:true
},
description:{
    type:String,
    default:null
},
nonvalue:{
    type:String,
    default:null
},
maturity:{
    type:Number,
    default:null
},
industry:{
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: "industry",
},

audio:{
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: "fileUpload",
},
jobRole:{
    // type: mongoose.Schema.Types.ObjectId,
    // required: false,
    // ref: "roles",
    type:String,
    required:false
},

file:[{    
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: "fileUpload",
}],
user:{
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: "auth",
},
coverImage: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: "fileUpload",
  },
  nonvaluestartTime:{
    type:Date,
    default:null,
},
nonvalueendTime:{
    type:Date,
    default:null,
},
},{
    timestamps: true,
    
})



const RecordModel = mongoose.model("record", RecordSchema);

export default RecordModel;