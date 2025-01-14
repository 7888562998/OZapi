import authModel from "../../DB/Model/authModel.js";
import { pool } from "../../DB/PGSql/index.js";
import { joseJwtDecrypt } from "../../Utils/AccessTokenManagement/Tokens.js";
import CustomError from "../../Utils/ResponseHandler/CustomError.js";
export const AuthMiddleware = async (req, res, next) => {
  const AuthHeader =
    req.headers.authorization ||
    req.body.token ||
    req.query.token ||
    req.headers["x-access-token"];
  if (!AuthHeader) {
    return next(CustomError.unauthorized());
  }
  const parts = AuthHeader.split(" ");
  try {
    if (parts.length !== 2) {
      return next(CustomError.unauthorized());
    }

    const [scheme, token] = parts;
    // token

    if (!/^Bearer$/i.test(scheme)) {
      return next(CustomError.unauthorized());
    }
    const UserToken = await joseJwtDecrypt(token);
    const query = `SELECT * FROM auths WHERE _id = $1`;
    const _id = UserToken.payload.uid;
    var UserDetail = await pool.query(query, [_id]);
    UserDetail= UserDetail.rows[0];
    // const UserDetail = await authModel
    //   .findOne({ _id: UserToken.payload.uid })
    //   .populate("image");

    if (!UserDetail) {
      return next(CustomError.unauthorized());
    }
    UserDetail.tokenType = UserToken.payload.tokenType;
    req.user = UserDetail;
    return next();
  } catch (error) {
    return next(CustomError.unauthorized());
  }
};

export const AdminMiddleware = async (req, res, next) => {
  const AuthHeader =
    req.headers.authorization ||
    req.body.token ||
    req.query.token ||
    req.headers["x-access-token"];
  console.log("Admin middle ware");

  if (!AuthHeader) {
    return next(CustomError.unauthorized());
  }
  const parts = AuthHeader.split(" ");
  try {
    if (parts.length !== 2) {
      return next(CustomError.unauthorized());
    }

    const [scheme, token] = parts;
    // token

    if (!/^Bearer$/i.test(scheme)) {
      return next(CustomError.unauthorized());
    }

    const UserToken = await joseJwtDecrypt(token);

    const UserDetail = await authModel
      .findOne({ _id: UserToken.payload.uid })
      .populate("image");

    if (!UserDetail) {
      return next(CustomError.unauthorized());
    }
    if (UserDetail.userType !== "admin") {
      return next(CustomError.unauthorized());
    }

    req.user = UserDetail;
    return next();
  } catch (error) {
    return next(CustomError.unauthorized());
  }
};
