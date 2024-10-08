import mongoose from "mongoose";

const CompanySchema = mongoose.Schema(
    {
      companyName: {
        type: String,
        required: true,
        default:false
      }
    }
    );
    
    const companyModel = mongoose.model("companies", CompanySchema);
    export default companyModel;