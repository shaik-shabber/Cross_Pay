import * as service from "./beneficiary.service.js";
import { sendSuccess } from "../../utils/response.util.js";
import { createHttpError } from "../../utils/httpError.js";

const getUserId = (req) => {
  if (!req.user?.id) {
    throw createHttpError(401, "Unauthorized");
  }
  return req.user.id;
};

export const listBeneficiaries = async (req, res) => {
  const data = await service.listBeneficiaries(getUserId(req));
  sendSuccess(res, { message: "Fetched", data });
};

export const createBeneficiary = async (req, res) => {
  const data = await service.createBeneficiary(getUserId(req), req.body);
  sendSuccess(res, { statusCode: 201, message: "Created", data });
};

export const updateBeneficiary = async (req, res) => {
  const data = await service.updateBeneficiary(
    getUserId(req),
    req.params.id,
    req.body
  );
  sendSuccess(res, { message: "Updated", data });
};

export const deleteBeneficiary = async (req, res) => {
  const data = await service.deleteBeneficiary(
    getUserId(req),
    req.params.id
  );
  sendSuccess(res, { message: "Deleted", data });
};
