import ContentModel from "../DB/Model/contentModel.js";
import CustomError from "../Utils/ResponseHandler/CustomError.js";
import CustomSuccess from "../Utils/ResponseHandler/CustomSuccess.js";
import { aboutValidator } from "../Utils/Validator/adminvalidator.js";


const getDocument = async (req, res,next) => {

  const contentType = req.path === "/privacy" ? "privacy" : req.path === "/terms" ? "terms" : req.path === "/about" ? "about" : "";
  try {
    const content = await ContentModel.find({ contentType: contentType })
    .sort({ createdAt: -1 }) // Sort by creation date in descending order
    .populate("file");
    return next(
      CustomSuccess.createSuccess(
        content,
        "Content Found",
        200
      )
    );
  } catch (err) {
    return next(CustomError.badRequest("No Content Found"));
      
  }
};

const getSingleDocument = async (req, res,next) => {
  try {
    const content = await ContentModel.findById(req.params.id);
    

    return next(
      CustomSuccess.createSuccess(
        content,
        "Content Found",
        200
      )
    );

  } catch (err) {
    return next(CustomError.badRequest("No Content Found"));
 
  }
};

const createDocument = async (req, res,next) => {
  try {

      const { error } = aboutValidator.validate(req.body);
      if (error) {
        return next(CustomError.badRequest(error.details[0].message));
      }
      const { title } = req.body;
    
const contentType = req.path === "/privacy" ? "privacy" : req.path === "/terms" ? "terms" : req.path === "/about" ? "about" : "";
    
    const { user } = req;
    

    const content = new ContentModel({
      title: title,
      user: user._id,
      contentType: contentType,
    });
    await content.save();
   

    return next(
      CustomSuccess.createSuccess(
        content,
        "Content Created",
        200
      )
    );


  } catch (err) {


    return next(CustomError.createError("Can't Create New Content Or You are not authorized", 404));
   
  }
};

const updateDocument = async (req, res) => {
  const { id } = req.params;
  try {
    const { user } = req;
    const { title, contentType } = req.body;

    const updatedContent = await ContentModel.findByIdAndUpdate(
      id,
      { title: title, user: user._id, contentType: contentType },
      { new: true }
    );

    if (!updatedContent) {
      return next(CustomError.createError("Content not found or you are not authorized to update this content", 404));
      
    }

    res.send(updatedContent);
  } catch (err) {
    return next(CustomError.createError("Content not found or you are not authorized to update this content", 404));
  
  }
};

const deleteDocument = async (req, res) => {
  try {
    const content = await ContentModel.findByIdAndRemove(req.params.id);
    
    if (!content) {
      return next(CustomError.createError("Content not found or you are not authorized to delete this content", 404));
    }

    return next(
      CustomSuccess.createSuccess({}, "Content deleted successfully", 200)
    );

  } catch (err) {
    console.error(err);
    return next(CustomError.badRequest("Content ID is invalid"));
    
  }
};

const ContentTextController = {
  getDocument,
  getSingleDocument,
  updateDocument,
  deleteDocument,
  createDocument,
};

export default ContentTextController;
