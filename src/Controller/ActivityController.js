
import CustomError from "../Utils/ResponseHandler/CustomError.js";
import CustomSuccess from "../Utils/ResponseHandler/CustomSuccess.js";
import fileUploadModel from "../DB/Model/fileUploadModel.js";
import RecordModel from "../DB/Model/recordModel.js";
import NotificationController from "./NotificationController.js";
import mongoose from "mongoose";
import ActivityModel from "../DB/Model/activityModel.js";
import SubActivityModel from "../DB/Model/subActivityModel.js";


const validateItemFormat = (item) => {
    if (!Array.isArray(item)) {
      return false; // "item" should be an array
    }
  
    const idSet = new Set(); // To check for unique "id" values
  
    for (const task of item) {
      if (typeof task === 'object' && 'id' in task && 'task' in task) {
        if (idSet.has(task.id)) {
          return false; // "id" is not unique
        }
        idSet.add(task.id);
      } else {
        return false; // Each item should have "id" and "task" properties
      }
    }
  
    return true; // "item" follows the correct format
  };
  

const createActivityforCase = async (req, res, next) => {

    try {
      const {user} = req
      
        const { ActivityID , item } = req.body;

        const MainActivity = await ActivityModel.findById(ActivityID);
        const Activities = await SubActivityModel.findOne({ActivityID , user});
// item should be in this for mat and id should be unique 
//"item":[{"id":1,"task":"Manage Dev Team"},{"id":2,"task":"Manage QA Team"}]

        const isItemValid = validateItemFormat(item);

        if (!isItemValid) {
          return res.status(400).json({
            status: 0,
            message: 'Invalid "item" format or non-unique "id" values',
          });
        }


if(Activities){
  let id = Activities._id
  const UpdateActivity = await SubActivityModel.findByIdAndUpdate(id,{item} , {new:true});
  return res.status(201).json({
    status: 1,
    message: 'Activity Created successfully',
    data: UpdateActivity,
  });
}

        const SubActivity = await SubActivityModel.create({ActivityID , item,user});
        
    
    
    
     
    
        return res.status(201).json({
          status: 1,
          message: 'Activity Created successfully',
          data: SubActivity,
        });
      } catch (error) {
        console.log(error);
        return res.status(400).json({ status: 0, message: error.message });
      }




    





}

const updateActivityforCase = async (req, res, next) => {

    try {
        const {  item } = req.body;
        const {user} = req
        const {id} = req.params
      

// item should be in this for mat and id should be unique 
//"item":[{"id":1,"task":"Manage Dev Team"},{"id":2,"task":"Manage QA Team"}]

        const isItemValid = validateItemFormat(item);

        if (!isItemValid) {
          return res.status(400).json({
            status: 0,
            message: 'Invalid "item" format or non-unique "id" values',
          });
        }
        const Activities = await SubActivityModel.findOne({ActivityID:id , user});


        if (!Activities) {
          return res.status(400).json({
            status: 0,
            message: 'Sub Activity Not Found',
          });
        }
        const UpdateActivity = await SubActivityModel.findByIdAndUpdate(Activities._id,{item} , {new:true});


     
    
        return res.status(201).json({
          status: 1,
          message: 'Activity Updated successfully',
          data: UpdateActivity,
        });
      } catch (error) {
        console.log(error);
        return res.status(400).json({ status: 0, message: error.message });
      }




    





}

const getActivityforCase = async (req, res, next) => {

    try {
        const {id} = req.params
const {user} = req
        const Activities = await SubActivityModel.findOne({ActivityID:id , user});



     
    
        return res.status(201).json({
          status: 1,
          message: 'Activities Retrived successfully',
          data: Activities,
        });
      } catch (error) {
        console.log(error);
        return res.status(400).json({ status: 0, message: error.message });
      }




    





}



const ActivityController = {
    createActivityforCase,
    updateActivityforCase,
    getActivityforCase
};

export default ActivityController;
