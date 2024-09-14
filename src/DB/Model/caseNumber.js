import mongoose from "mongoose";

const CaseNumberSchema = new mongoose.Schema(
  {
    caseNumber: {
      type: Number,
      default: 0, 
    },

  
  },
  {
    timestamps: true,
  }
);

const CaseNumberModel = mongoose.model("CaseNumber", CaseNumberSchema);



CaseNumberModel.findOne()
  .then((existingDocument) => {
    if (!existingDocument) {
         // If no document exists, create a new one with caseNumber as 1
         const caseNumberInstance = new CaseNumberModel();
         return caseNumberInstance.save();
    } 
  })
  .then((savedInstance) => {
    if (savedInstance) {
      console.log("CaseNumber saved successfully:", savedInstance);
    }
  })
  .catch((error) => {
    console.error("Error checking or saving CaseNumber:", error);
  })

export default CaseNumberModel;
