import CustomError from "../Utils/ResponseHandler/CustomError.js";
import CustomSuccess from "../Utils/ResponseHandler/CustomSuccess.js";
import fileUploadModel from "../DB/Model/fileUploadModel.js";
import { handleMultipartData } from "../Utils/MultipartData.js";
import mongoose from "mongoose";
import ActivityModel from "../DB/Model/activityModel.js";
import SubActivityModel from "../DB/Model/subActivityModel.js";
import PreAuditModel from "../DB/Model/PreAuditModel.js";
import AuditModel from "../DB/Model/AuditModel.js";
import CaseNumberModel from "../DB/Model/caseNumber.js";
import authModel from "../DB/Model/authModel.js";
import NonValueActivtyModel from "../DB/Model/NonValueActivity.js";
import { getTotalMinutes } from "../Utils/getTotalMinutes.js";
import { pool } from "../DB/PGSql/index.js";

const validateItemFormat = (item) => {
  if (!Array.isArray(item)) {
    return false; // "item" should be an array
  }

  const idSet = new Set(); // To check for unique "id" values

  for (const task of item) {
    if (typeof task === "object" && "id" in task && "task" in task) {
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
const CreateNonValueAdded = async (req, res, next) => {
  try {
    const {
      title,
      StartTime,
      EndTime,
      caseNumber,
      description,
      ActivityID,
      PreAuditId,
    } = req.body;

    const query = `
      INSERT INTO nonvalueactivties (
        title, 
        "StartTime", 
        "EndTime", 
        "caseNumber", 
        description, 
        "ActivityID", 
        "PreAuditId"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const values = [
      title,
      StartTime,
      EndTime,
      caseNumber,
      description,
      ActivityID,
      PreAuditId,
    ];
    const result = await pool.query(query, values);

    return res.status(200).json({
      status: 1,
      message: "Non-Value activity added successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error inserting data:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const getNonActivites = async (req, res, next) => {
  try {
    const { PreAuditId } = req.params;

    const query = 'SELECT * FROM nonvalueactivties WHERE "PreAuditId" = $1';
    const { rows } = await pool.query(query, [PreAuditId]);

    if (rows.length === 0) {
      return next(
        CustomError.createError('No pre-audit information found', 404)
      );
    }

    return next(
      CustomSuccess.createSuccess(
        { preAuditList: rows },
        'Preaudit Information retrieved successfully',
        200
      )
    );
  } catch (error) {
    next(CustomError.createError(error.message, 500));
  }
};
const CreatePreAudit = async (req, res, next) => {
  try {
    const { user } = req;

    const preAuditDataArray = req.body;

    const validMinutes = 540; // 9 hours shift

    let totalMinutes = preAuditDataArray.reduce((acc, obj) => {
      return acc + (getTotalMinutes(obj.StartTime, obj.EndTime) || 0);
    }, 0);
    if (totalMinutes > validMinutes) {
      return res.status(400).json({
        status: 0,
        message: "Total pre audit minutes should be less than 9 hours",
      });
    }

    const findCaseNumber = await CaseNumberModel.findOne().sort("-caseNumber");
    const newCase = await CaseNumberModel.create({
      caseNumber: findCaseNumber ? findCaseNumber.caseNumber + 1 : 1,
    });

    // Assuming req.body is an array of PreAudit data

    const preAuditInstances = [];

    for (const preAuditData of preAuditDataArray) {
      const { ActivityID, description, StartTime, EndTime, EstimatedPer } =
        preAuditData;

      const PreAudit = await PreAuditModel.create({
        user: user._id,
        ActivityID,
        description,
        caseNumber: newCase.caseNumber,
        StartTime,
        EndTime,
        EstimatedPer,
      });

      preAuditInstances.push(PreAudit);
    }

    await authModel.findByIdAndUpdate(
      user._id,
      { currentCase: newCase.caseNumber },
      {
        new: true,
      }
    );
    return res.status(200).json({
      status: 1,
      message: "Pre-Audit(s) created successfully",
      caseNumber: newCase.caseNumber,
      data: preAuditInstances,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ status: 0, message: error.message });
  }
};

const CreateStartStudy = async (req, res, next) => {
  try {
    const { user } = req;

    const preAuditDataArray = req.body;
    const caseNumberQuery = `SELECT * FROM casenumbers ORDER BY "caseNumber" DESC LIMIT 1`;
    var findCaseNumber = await pool.query(caseNumberQuery);
    findCaseNumber = findCaseNumber.rows[0];

    const insertNewCaseQuery = `INSERT INTO casenumbers ("caseNumber") VALUES ($1) RETURNING *;`;
    const newCaseNumber = findCaseNumber ? findCaseNumber.caseNumber + 1 : 1;
    await pool.query(insertNewCaseQuery, [newCaseNumber]);

    const preAuditInstances = [];

    for (const preAuditData of preAuditDataArray) {
      const { ActivityID, StartTime, EndTime } = preAuditData;
      const insertPreAuditQuery = `INSERT INTO preaudits ("user", "ActivityID", "caseNumber","StartTime","EndTime") VALUES ($1, $2, $3,$4,$5) RETURNING *;`;

      const preauditsaved = await pool.query(insertPreAuditQuery, [
        user._id,
        ActivityID,
        newCaseNumber,
        StartTime,
        EndTime,
      ]);

      preAuditInstances.push(preauditsaved.rows[0]);
    }

    const updateQuery = `UPDATE auths SET "currentCase" = $1 WHERE _id = $2 RETURNING *;`;

    const updatedcase = await pool.query(updateQuery, [
      newCaseNumber,
      user._id,
    ]);
    return res.status(200).json({
      status: 1,
      message: "Pre-Audit(s) created successfully",
      caseNumber: newCaseNumber,
      data: preAuditInstances,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ status: 0, message: error.message });
  }
};

const UpdateStartStudy = async (req, res, next) => {
  try {
    const { user } = req;
    const { preAuditData, caseNumber } = req.body;

    const { ActivityID, StartTime, EndTime } = preAuditData;
    if (!ActivityID || !StartTime || !EndTime) {
      return res
        .status(400)
        .json({ message: "Missing required fields in preAuditData." });
    }

    const updateQuery = `UPDATE preaudits SET "StartTime" = $1, "EndTime" = $2 
    WHERE "user" = $3  and "caseNumber" = $4 and "ActivityID" = $5 RETURNING *;`;

    await pool.query(updateQuery, [
      StartTime,
      EndTime,
      user._id,
      caseNumber,
      ActivityID,
    ]);
    return res
      .status(200)
      .json({ message: "Pre-audit data updated successfully." });
  } catch (error) {
    console.error("Error updating pre-audit data:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const getStartStudy = async (req, res, next) => {
  try {
    const { user } = req;
    const preAuditList = await PreAuditModel.aggregate([
      {
        $match: { user: new mongoose.Types.ObjectId(user._id.toString()) },
      },
    ]);

    return next(
      CustomSuccess.createSuccess(
        {
          preAuditList,
        },
        "Preaudit Information retrieved successfully",
        200
      )
    );
  } catch (error) {
    next(CustomError.createError(error.message, 500));
  }
};

const getStartStudyByCaseNumber = async (req, res, next) => {
  try {
    const { caseNumber } = req.params;
    const query = `SELECT pa.*, a.title AS "activityTitle" FROM preaudits pa 
    LEFT JOIN activities a ON pa."ActivityID" = a._id 
    WHERE pa."caseNumber" = $1;`;
    var preAuditList = await pool.query(query, [Number(caseNumber)]);
    preAuditList = preAuditList.rows;
    return next(
      CustomSuccess.createSuccess(
        {
          preAuditList,
        },
        "Preaudit Information retrieved successfully",
        200
      )
    );
  } catch (error) {
    next(CustomError.createError(error.message, 500));
  }
};


const CreateAudit = async (req, res, next) => {
  try {
    const { user } = req;
    const {
      ActivityID,
      caseNumber,
      description,
      PreAuditId,
      StartTime,
      EndTime,
    } = req.body;

    const getActivityByIdQuery = `SELECT * FROM activities WHERE _id = $1`;
    var findActivity = await pool.query(getActivityByIdQuery, [ActivityID]);
    findActivity = findActivity.rows[0];
    if (!findActivity) {
      return res
        .status(400)
        .json({ status: 400, message: "Activity not found" });
    }

    const getPreAuditByIdAndCaseQuery = `SELECT * FROM preAudits WHERE _id = $1 and "caseNumber" = $2`;
    var findPreAudit = await pool.query(getPreAuditByIdAndCaseQuery, [PreAuditId, caseNumber]);
    findPreAudit = findPreAudit.rows[0];

    if (!findPreAudit) {
      return res.status(400).json({
        status: 400,
        message: "Preaudit not found with this Pre audit or case number",
      });
    }

    const getPreAuditByIdQuery = `SELECT * FROM audits WHERE "PreauditID" = $1`;
    var findAuditByPreAudit = await pool.query(getPreAuditByIdQuery, [PreAuditId]);
    findAuditByPreAudit = findAuditByPreAudit.rows[0];

    if (findAuditByPreAudit) {
      return res.status(400).json({
        status: 400,
        message: "Audit with this pre audit already exist",
      });
    }


    const getPreAuditByCaseQuery = `SELECT * FROM preaudits WHERE "caseNumber" = $1`;
    var findPreAudits = await pool.query(getPreAuditByCaseQuery, [caseNumber]);
    findPreAudits = findPreAudits.rows;

    if (findPreAudits.length === 0) {
      return res.status(400).json({
        status: 400,
        message: "Pre audits not found with this case number",
      });
    }

    const getAuditsByCaseQuery = `SELECT * FROM audits WHERE "caseNumber" = $1`;
    var findAudits = await pool.query(getAuditsByCaseQuery, [caseNumber]);
    findAudits = findAudits.rows
  
    if (findAudits.length === findPreAudits.length) {
      return res
        .status(400)
        .json({ status: 400, message: "Pre audit and audit length are same" });
    }

    let Documents = [];
    let Recording = [];
    if (req.files["Documents"]) {
      const file = req.files["Documents"];
      for (const el of file) {
      const query = `INSERT INTO fileuploads (file, "fileType", "user") VALUES ($1, $2, $3) RETURNING _id;`;
        const values = [el.filename, el.mimetype, user._id];
        try {
          const result = await pool.query(query, values);
          Documents.push(result.rows[0]._id);
        } catch (error) {
          console.error("Error inserting file upload:", error);
        }
      }
    }

    if (req.files["Recording"]) {
      const RecordingFile = req.files["Recording"];
      for (const el of RecordingFile) {
        const query = `INSERT INTO fileuploads (file, "fileType", "user") VALUES ($1, $2, $3) RETURNING _id;`;
        const values = [el.filename, el.mimetype, user._id];  
        try {
          const result = await pool.query(query, values);
          Recording.push(result.rows[0]._id); // Push the inserted file's ID into the Recording array
        } catch (error) {
          console.error("Error inserting Recording file upload:", error);
        }
      }
    }

    const startingTime = new Date(StartTime);
    const endTime = new Date(EndTime);
    const totalDuration = endTime - startingTime;

    const getPreauditRecordQuery = `SELECT * FROM preaudits WHERE "ActivityID"=$1 and "caseNumber" = $2`;
    var PreauditRecord = await pool.query(getPreauditRecordQuery, [ActivityID, caseNumber]);
    PreauditRecord = PreauditRecord.rows[0]

    const preStartingTime = new Date(PreauditRecord.StartTime);
    const preEndTime = new Date(PreauditRecord.EndTime);

    const elapsedDuration = preEndTime - preStartingTime;
    const percentage = Math.abs((elapsedDuration / totalDuration) * 100);

    const updatedRecordQuery = 'UPDATE preaudits SET "totalPercentage" = $1 WHERE "ActivityID" = $2 AND "caseNumber" = $3 RETURNING *'

    const updatedRecords = await pool.query(
      updatedRecordQuery,
      [percentage, ActivityID, caseNumber]
    );

    const result = await pool.query(
      `INSERT INTO audits (userid, "ActivityID", description, "caseNumber", "StartTime", "EndTime", "PreauditID","Documents", "Recording")
       VALUES ($1, $2, $3, $4, $5, $6, $7,$8,$9)
       RETURNING *`,
      [
        user._id,
        ActivityID,
        description,
        caseNumber,
        StartTime,
        EndTime,
        PreAuditId,
        Documents,
        Recording
      ]
    );

    const audit = result.rows[0];
    var newPreAudit = await pool.query(`SELECT * FROM audits WHERE "caseNumber" = $1`, [caseNumber]);
    newPreAudit = newPreAudit.rows;

    let remainCount = findPreAudits.length - newPreAudit.length;

    await pool.query(
      `UPDATE auths 
       SET "currentCase" = $1 
       WHERE _id = $2 
       RETURNING *`,
      [0, user._id]
    );

    return res.status(201).json({
      status: 1,
      message: "Audit Created successfully",
      data: { ...audit, remainCount },
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: 0, message: error.message });
  }
};


const updateActivityforCase = async (req, res, next) => {
  try {
    const { item } = req.body;
    const { id } = req.params;
    const isItemValid = validateItemFormat(item);

    if (!isItemValid) {
      return res.status(400).json({
        status: 0,
        message: 'Invalid "item" format or non-unique "id" values',
      });
    }

    const UpdateActivity = await SubActivityModel.findByIdAndUpdate(
      id,
      { item },
      { new: true }
    );

    return res.status(201).json({
      status: 1,
      message: "Activity Updated successfully",
      data: UpdateActivity,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: 0, message: error.message });
  }
};

const getActivityforCase = async (req, res, next) => {
  try {
    const { id } = req.params;

    const Activities = await SubActivityModel.findById(id);

    return res.status(201).json({
      status: 1,
      message: "Activities Retrived successfully",
      data: Activities,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: 0, message: error.message });
  }
};

const getAudit = async (req, res, next) => {
  try {
    const { activityId, caseNo } = req.body;
    const query = `
    SELECT * FROM audits
    WHERE "ActivityID" = $1 AND "caseNumber" = $2
  `;
    const values = [activityId, caseNo];
    const { rows } = await pool.query(query, values);

    return next(
      CustomSuccess.createSuccess(
        rows,
        "Audit Information retrieved successfully",
        200
      )
    );
  } catch (error) {
    next(CustomError.createError(error.message, 500));
  }
};

const AuditController = {
  CreatePreAudit,
  CreateStartStudy,
  UpdateStartStudy,
  getStartStudy,
  getStartStudyByCaseNumber,
  CreateNonValueAdded,
  getNonActivites,
  getAudit,
  CreateAudit: [
    handleMultipartData.fields([
      { name: "Recording", maxCount: 5 },
      { name: "Documents" },
    ]),
    CreateAudit,
  ],
};

export default AuditController;
