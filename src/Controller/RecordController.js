
import CustomError from "../Utils/ResponseHandler/CustomError.js";
import CustomSuccess from "../Utils/ResponseHandler/CustomSuccess.js";
import fileUploadModel from "../DB/Model/fileUploadModel.js";
import RecordModel from "../DB/Model/recordModel.js";
import NotificationController from "./NotificationController.js";
import mongoose from "mongoose";
import PreAuditModel from "../DB/Model/PreAuditModel.js";
import AuditModel from "../DB/Model/AuditModel.js";
import NonValueActivtyModel from "../DB/Model/NonValueActivity.js";
import ActivityModel from "../DB/Model/activityModel.js";
import { getTotalMinutes } from "../Utils/getTotalMinutes.js";
import { pool } from "../DB/PGSql/index.js";

const createRecord = async (req, res, next) => {
  try {
    const { user } = req;
    const file = [];

    const { recordType,
      title,
      description,
      maturity,
      industry,
      audio,
      jobRole,
      file: files,
      coverImage,
      startTime,
      endTime } = req.body;

    const Record = new RecordModel({
      recordType,
      title,
      description,
      maturity,
      industry: industry ? mongoose.Types.ObjectId(industry) : null,
      audio: audio ? mongoose.Types.ObjectId(audio) : null,
      jobRole,
      file: files ? files.map((file) => mongoose.Types.ObjectId(file)) : [],
      user: user._id ? mongoose.Types.ObjectId(user._id) : null,
      coverImage: coverImage ? mongoose.Types.ObjectId(coverImage) : null,
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
    });

    await Record.save();

    return next(CustomSuccess.createSuccess(Record, "Record Created", 200));
  } catch (err) {
    console.log(err);
    return next(CustomError.createError("Can't Create New Record Or You are not authorized", 404));
  }
};


function mergeObjects(...objects) {
  const merged = {};

  // Iterate over each object
  objects.forEach(obj => {
    // Iterate over keys of current object
    Object.keys(obj).forEach(key => {
      // Concatenate arrays if both values are arrays
      if (Array.isArray(obj[key]) && Array.isArray(merged[key])) {
        merged[key] = merged[key].concat(obj[key]);
      } else {
        // Otherwise, assign the value
        merged[key] = obj[key];
      }
    });
  });

  return merged;
}

function formatNumberWithoutRounding(number) {
  const formattedNumber = parseFloat(number).toFixed(10); // Fixed to a large number of decimal places
  const decimalIndex = formattedNumber.indexOf('.');
  return parseFloat(formattedNumber.slice(0, decimalIndex + 3)); // Extracting only two decimal places
}


function calculatePercentage({ preAuditRecords, auditRecords }) {
  let results = []
  preAuditRecords.forEach((el) => {
    auditRecords.forEach((jl) => {
      if (el._id.toString() === jl.PreauditID.toString()) {
        let preAuditStartTime = new Date(el.StartTime)
        let auditStartTime = new Date(jl.StartTime)
        let preAuditEndTime = new Date(el.EndTime)
        let auditEndTime = new Date(jl.EndTime)

        console.log(preAuditStartTime, "preAuditStartTime")
        console.log(preAuditEndTime, "preAuditEndTime")
        console.log(auditStartTime, "auditStartTime")
        console.log(auditEndTime, "auditEndTime")
        console.log(el.ActivityID.toString(), "Activity ID", el._id, "Pre audit ID")

        if (preAuditEndTime < preAuditStartTime) preAuditEndTime = new Date(preAuditEndTime.getTime() + 24 * 60 * 60 * 1000);
        if (auditEndTime < auditStartTime) auditEndTime = new Date(auditEndTime.getTime() + 24 * 60 * 60 * 1000);


        const duration1 = preAuditEndTime - preAuditStartTime;
        const overlapStart = preAuditStartTime < auditStartTime ? auditStartTime : preAuditStartTime;
        const overlapEnd = preAuditEndTime < auditEndTime ? preAuditEndTime : auditEndTime;
        const overlapDuration = Math.max(0, overlapEnd - overlapStart);
        const overlapPercentage1 = (overlapDuration / duration1) * 100;

        console.log(overlapPercentage1, "Overlap percentage")
        results.push({
          activity_id: jl.ActivityID.toString(),
          percentage: overlapPercentage1,
          audit_desc: [jl.description],
          pre_audit_desc: [el.description],
          estimatedPer: el.EstimatedPer,
          preAuditStartTime: preAuditStartTime,
          preAuditEndTime,
          activity_title: el.ActivityID.title

        })

      }
    })
  })
  console.log(results, "RESULTS")
  // const arrayHashmap = results.reduce((obj, item) => {
  //   obj[item.activity_id] ? (obj[item.activity_id].percentage.push(...item.percentage), obj[item.activity_id].audit_desc.push(...item.audit_desc), obj[item.activity_id].pre_audit_desc.push(...item.pre_audit_desc)) : (obj[item.activity_id] = { ...item });
  //   return obj;
  // }, {});

  // const mergedArray = Object.values(arrayHashmap).map((el) => {
  //   return {
  //     ActivityID: el.activity_id,
  //     time: el.percentage.reduce((acc, val) => acc + val, 0) / el.percentage.length + "%",
  //     audit_desc: el.audit_desc,
  //     pre_audit_desc: el.pre_audit_desc

  //   }
  // })
  // console.log(mergedArray, "MERGER ARRAY")

  return results;
}

function calculateNoValueActivity({ records, nonValueActivities }) {

  let results = []
  let originalResults = []
  records.forEach((el) => {
    nonValueActivities.forEach((jl) => {
      if (el.activity_id === jl.ActivityID.toString()) {
        let preAuditStartTime = el.preAuditStartTime
        let nonValueStartTime = new Date('1970-01-01T' + jl.StartTime)
        let preAuditEndTime = el.preAuditEndTime
        let nonValueEndTime = new Date('1970-01-01T' + jl.EndTime)

        console.log(preAuditStartTime, "NON preAuditStartTime")
        console.log(preAuditEndTime, "NON preAuditEndTime")
        console.log(nonValueStartTime, "NON auditStartTime")
        console.log(nonValueEndTime, "NON auditEndTime")
        // console.log(el.ActivityID.toString(), "Activity ID", el._id, "Pre audit ID")

        if (preAuditEndTime < preAuditStartTime) preAuditEndTime = new Date(preAuditEndTime.getTime() + 24 * 60 * 60 * 1000);
        if (nonValueEndTime < nonValueStartTime) nonValueEndTime = new Date(nonValueEndTime.getTime() + 24 * 60 * 60 * 1000);


        const duration1 = preAuditEndTime - preAuditStartTime;

        const overlapStart = preAuditStartTime < nonValueStartTime ? nonValueStartTime : preAuditStartTime;
        const overlapEnd = preAuditEndTime < nonValueEndTime ? preAuditEndTime : nonValueEndTime;
        const overlapDuration = Math.max(0, overlapEnd - overlapStart);
        const overlapPercentage1 = (overlapDuration / duration1) * 100;
        console.log(duration1, "NON duration1")
        console.log(overlapStart, "NON overlapStart")
        console.log(overlapDuration, "NON overlapDuration")
        console.log(overlapPercentage1, "Non Overlap percentage")
        if (overlapPercentage1 > 0) {
          results.push({
            activity_id: jl.ActivityID.toString(),
            percentage: overlapPercentage1,
            percentage2: el.percentage - overlapPercentage1,
            audit_desc: el.audit_desc,
            estimatedPer: el.estimatedPer,
            pre_audit_desc: el.pre_audit_desc,
            activity_title: el.activity_title,
            non_activity_title: jl.title,
            nvac: {
              "Skills": jl.title === "Skills" ? [overlapPercentage1] : [],
              "Behaviour": jl.title === "Behaviour" ? [overlapPercentage1] : [],
              "System": jl.title === "System" ? [overlapPercentage1] : [],
              "Technical": jl.title === "Technical" ? [overlapPercentage1] : []
            },
            nvac_time: {
              "Skills": jl.title === "Skills" ? [getTotalMinutes(jl.StartTime, jl.EndTime)] : [],
              "Behaviour": jl.title === "Behaviour" ? [getTotalMinutes(jl.StartTime, jl.EndTime)] : [],
              "System": jl.title === "System" ? [getTotalMinutes(jl.StartTime, jl.EndTime)] : [],
              "Technical": jl.title === "Technical" ? [getTotalMinutes(jl.StartTime, jl.EndTime)] : []
            }
          })

        }

      } else {
        // results.push({
        //   activity_id: el.activity_id,
        //   percentage: el.percentage,
        //   audit_desc: el.audit_desc,
        //   pre_audit_desc: el.pre_audit_desc,
        //   activity_title:el.activity_title,

        // })
      }
    })
  })

  console.log(results, "NON RESULTS")
  records.forEach((el) => {
    const findInResults = results.find((jl) => jl.activity_id === el.activity_id)
    if (!findInResults) {
      originalResults.push(el)
    }
  })
  console.log(originalResults, "NON Original RESULTS")
  const originalResults1 = [...results, ...originalResults].map((el) => {
    return {

      percentage: el.percentage2 !== undefined || null ? [el.percentage2] : [el.percentage],
      activity_id: el.activity_id,
      audit_desc: el.audit_desc,
      pre_audit_desc: el.pre_audit_desc,
      activity_title: el.activity_title,
      nvac: el.nvac,
      nvacPer: el.nvacPer,
      estimatedPer: el.estimatedPer,
      nvac_time: el.nvac_time
    }
  })
  console.log(JSON.stringify(originalResults1), "Original results 1")
  const arrayHashmap = originalResults1.reduce((obj, item) => {
    // const checkNvac = el.nvac
    console.log(obj[item.activity_id], "Activity check")
    if (obj[item.activity_id]) {

      if (obj[item.activity_id].nvac['System']) {
        obj[item.activity_id].nvac['System'].push(...item.nvac['System'])
      }
      if (obj[item.activity_id].nvac['Skills']) {
        obj[item.activity_id].nvac['Skills'].push(...item.nvac['Skills'])
      }
      if (obj[item.activity_id].nvac['Behaviour']) {
        obj[item.activity_id].nvac['Behaviour'].push(...item.nvac['Behaviour'])
      }
      if (obj[item.activity_id].nvac['Technical']) {
        obj[item.activity_id].nvac['Technical'].push(...item.nvac['Technical'])
      }
      if (obj[item.activity_id].nvac_time['System']) {
        obj[item.activity_id].nvac_time['System'].push(...item.nvac_time['System'])
      }
      if (obj[item.activity_id].nvac_time['Skills']) {
        obj[item.activity_id].nvac_time['Skills'].push(...item.nvac_time['Skills'])
      }
      if (obj[item.activity_id].nvac_time['Behaviour']) {
        obj[item.activity_id].nvac_time['Behaviour'].push(...item.nvac_time['Behaviour'])
      }
      if (obj[item.activity_id].nvac_time['Technical']) {
        obj[item.activity_id].nvac_time['Technical'].push(...item.nvac_time['Technical'])
      }

      (obj[item.activity_id].percentage.push(...item.percentage),
        obj[item.activity_id].audit_desc.push(...item.audit_desc), obj[item.activity_id].pre_audit_desc.push(...item.pre_audit_desc))
    } else {
      (obj[item.activity_id] = { ...item })
    }
    // obj[item.activity_id] ? (obj[item.activity_id].percentage.push(...item.percentage),obj[item.activity_id].nvacPer.push(...item.nvacPer),  obj[item.activity_id].audit_desc.push(...item.audit_desc), obj[item.activity_id].pre_audit_desc.push(...item.pre_audit_desc)) : (obj[item.activity_id] = { ...item });
    return obj;
  }, {});

  console.log(arrayHashmap, "Array hash map")

  const mergedArray = Object.values(arrayHashmap).map((el) => {

    const calculateNvac = () => {
      if (el.nvac) {

        let system = el.nvac['System']
        let skills = el.nvac['Skills']
        let behaviour = el.nvac['Behaviour']
        let technical = el.nvac['Technical']
        if (system) {
          el.nvac['System'] = el.nvac['System'].length > 0 ? el.nvac['System'].reduce((acc, val) => acc + val, 0) / el.nvac['System'].length : null
        }
        if (skills) {
          el.nvac['Skills'] = el.nvac['Skills'].length > 0 ? el.nvac['Skills'].reduce((acc, val) => acc + val, 0) / el.nvac['Skills'].length : null

        }
        if (behaviour) {
          el.nvac['Behaviour'] = el.nvac['Behaviour'].length > 0 ? el.nvac['Behaviour'].reduce((acc, val) => acc + val, 0) / el.nvac['Behaviour'].length : null

        }
        if (technical) {
          el.nvac['Technical'] = el.nvac['Technical'].length > 0 ? el.nvac['Technical'].reduce((acc, val) => acc + val, 0) / el.nvac['Technical'].length : null

        }
        const checkNvac = Object.keys(el.nvac).map((nl) => {
          return {
            [nl]: {
              per: el.percentage.reduce((acc, val) => acc + val, 0) / el.percentage.length,
              nvac: el.nvac[nl],
              check_nvac: el.nvac[nl] !== null ? [el.nvac[nl]].reduce((acc, val) => acc + val, 0) / Object.values(el.nvac).filter((ol) => ol !== null).length : el.nvac[nl]
            }
          }
        })
        console.log(checkNvac, "Check NVAC AGAIN")
      }
    }
    calculateNvac()
    let nvac = {};
    if (el.nvac) {
      Object.keys(el.nvac).forEach((nl) => {
        nvac[nl] = el.nvac[nl] !== null ? [el.nvac[nl]].reduce((acc, val) => acc + val, 0) / Object.values(el.nvac).filter((ol) => ol !== null).length : el.nvac[nl]

      })

    }
    console.log(nvac, "NVAC CHECK AGAIN")

    return {
      ActivityID: el.activity_id,
      time: el.nvac ? 100 - Object.values(el.nvac).reduce((acc, val) => acc + val, 0) / Object.values(el.nvac).filter((ol) => ol !== null).length : el.percentage.reduce((acc, val) => acc + val, 0) / el.percentage.length,
      // time:totalNonPercentage > totalActivityPercentage ? totalNonPercentage - totalActivityPercentage : totalActivityPercentage - totalNonPercentage,
      // time: totalActivityPercentage,
      audit_desc: el.audit_desc,
      pre_audit_desc: el.pre_audit_desc,
      estimatedPer: el.estimatedPer,
      activity_title: el.activity_title,
      // nvacCheck: el.nvac ? nvac : {
      //   "system_calculated": 0
      // },
      nvac: el.nvac ? nvac : {
        "system_calculated": 0
      },
      nvac_time: el.nvac_time
      // nvacPer: el.nvacPer ? el.nvacPer.reduce((acc, val) => acc + val, 0) / el.nvacPer.length + '%' : 0 + '%',
    }
  })

  function removeBlankAttributes(obj) {
    const result = {};
    for (const key in obj) {
      if (obj[key] !== null) {
        result[key] = obj[key].toFixed(2) + "%";
      }
    }
    return result;
  }


  console.log(mergedArray, "MERGER ARRAY")
  let NonValueAddedActivity = []
  let NonValueAddedActivityTime = []
  let NonValueAddedActivityAvergae = {}
  let NonValueAddedActivityTimePercentage = {}
  let NonValueActivityTimePercentage = {}

  let finalResults = {
    titleCounts: {
      ActivitesPercentage: {

      },
      TotalPercentage: {

      }
    },
    NonValueAddedActivity: {}
  }


  mergedArray.forEach((el) => {
    console.log(el?.nvac_time, "NVAC time")
    finalResults.titleCounts.ActivitesPercentage[el.activity_title] = {
      activity: el.time.toFixed(2) + "%",
      nvac: removeBlankAttributes(el.nvac),
      audit_desc: el.audit_desc,
      pre_audit_desc: el.pre_audit_desc,
      estimatedPer: el.estimatedPer
    },

      finalResults.titleCounts.TotalPercentage[el.activity_title] = el.time.toFixed(2) + "%";
    NonValueAddedActivity.push(...Object.keys(removeBlankAttributes(el.nvac)))
    if (el?.nvac_time) {
      NonValueAddedActivityTime.push(el?.nvac_time)

    }
  })

  NonValueAddedActivity.filter((kl) => kl !== 'system_calculated').forEach(function (x) { finalResults.NonValueAddedActivity[x] = (finalResults.NonValueAddedActivity[x] || 0) + 1 });
  const mergeNonValueObjects = mergeObjects(...NonValueAddedActivityTime)
  Object.keys(mergeNonValueObjects).forEach((pl) => {
    const totalMinutes = mergeNonValueObjects[pl].reduce((acc, obj) => {
      return acc + (obj || 0)
    }, 0);
    const totalShiftPercentage = (totalMinutes / 540) * 100;
    // const sum = numbers.reduce((acc, num) => acc + num, 0);
    NonValueAddedActivityTimePercentage[pl] = formatNumberWithoutRounding(totalShiftPercentage) + '%'
    NonValueAddedActivityAvergae[pl] = totalMinutes
  })
  Object.keys(NonValueAddedActivityAvergae).forEach((pl) => {
    const totalNonValuePer = Object.values(NonValueAddedActivityAvergae).reduce((acc, obj) => {
      return acc + (obj || 0)
    }, 0);
    const percentage = (NonValueAddedActivityAvergae[pl] / totalNonValuePer) * 100
    NonValueActivityTimePercentage[pl] = percentage
  })
  finalResults['NonValueActivityTimePercentage'] = NonValueActivityTimePercentage
  finalResults['NonValueAddedActivityAverage'] = NonValueAddedActivityAvergae

  console.log(NonValueActivityTimePercentage, "Non value time")
  console.log(JSON.stringify(finalResults), "Final Results")
  console.log(JSON.stringify(NonValueAddedActivity), "NonValueAddedActivity")

  return finalResults;
}



const MatchPreAuditAndAudit = async (req, res) => {



  try {
    const { caseNumber } = req.body;

    if (!caseNumber) {
      return res.status(400).json({
        success: false,
        message: "Missing caseNumber in the request body.",
      });
    }
    const auditRecords = await AuditModel.find({ caseNumber }).populate(["Recording", "Documents"])

    const nonValueActivityRecords = await NonValueActivtyModel.find({ caseNumber });
    console.log(nonValueActivityRecords, "NON VALUE ACT")

    const PreAudit = await PreAuditModel.find({ caseNumber }).populate("ActivityID");

    let matchingTimesAndActivityIDs = calculatePercentage({ auditRecords, preAuditRecords: PreAudit });
    let titleCounts = calculateNoValueActivity({ records: matchingTimesAndActivityIDs, nonValueActivities: nonValueActivityRecords });

    console.log(PreAudit, "Preaudit records")
    let totalMinutes = PreAudit.reduce((acc, obj) => {
      return acc + (getTotalMinutes(obj.StartTime, obj.EndTime) || 0)
    }, 0);
    const totalShiftPercentage = (totalMinutes / 540) * 100;
    console.log(totalShiftPercentage, "Total minutes")

    let recordings = auditRecords.map((el) => {

      return el?.Recording ? el?.Recording.map((jl) => {
        return {
          url: process.env.BASE_URL + jl?.file,
          fileType: jl?.fileType
        }
      }) : []

    })
    let documents = auditRecords.map((el) => {

      return el?.Documents ? el?.Documents.map((jl) => {
        return {
          url: process.env.BASE_URL + jl?.file,
          fileType: jl?.fileType
        }
      }) : []

    })
    let estimatedPer = PreAudit.map((el) => {

      return {
        preAuditId: el._id.toString(),
        activityId: el?.ActivityID?._id.toString(),
        activityTitle: el?.ActivityID?.title,
        estimatedPer: el?.EstimatedPer,

      }

    })
    const response = {
      ...titleCounts,
      totalShiftPercentage: formatNumberWithoutRounding(totalShiftPercentage) + '%',
      recordings: recordings.flat(1),
      documents: documents.flat(1),
      estimatedPer: estimatedPer
    }
    return res.json(response);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// const getAllCases = async (req, res) => {

//   try {

//     const user = req.user
//     console.log(user, "USER")
//     const cases = await PreAuditModel.aggregate([
//       { $match: { user: user._id } },
//       { $group: { _id: { caseNumber: "$caseNumber" } } },
//       { $sort: { "_id.caseNumber": -1 } }
//     ])
//     return res.json(cases);
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };

const getAllCases = async (req, res) => {
  try {
    const user = req.user;;

    const query = `
    SELECT "caseNumber"
    FROM preaudits
    WHERE "user" = $1
    GROUP BY "caseNumber"
    ORDER BY "caseNumber" DESC;
  `;

    const values = [user._id];

    const { rows: cases } = await pool.query(query, values);

    const transformedCases = cases.map(caseItem => ({
      _id: {
        caseNumber: caseItem.caseNumber
      }
    }));

    return res.json(transformedCases);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const RecordController = {
  createRecord,
  MatchPreAuditAndAudit,
  getAllCases
};

export default RecordController;
