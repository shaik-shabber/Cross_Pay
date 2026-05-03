import * as service from "./admin.service.js";
import { sendSuccess } from "../../utils/response.util.js";

export const getOverview = async (req, res, next) => {
  try {
    const data = await service.getOverview();
    sendSuccess(res, { data });
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const data = await service.listUsers();
    sendSuccess(res, { data });
  } catch (error) {
    next(error);
  }
};

export const getUserDetails = async (req, res, next) => {
  try {
    const data = await service.getUserDetails(req.params.userId);
    sendSuccess(res, { data });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const data = await service.updateUser(req.params.userId, req.body);
    sendSuccess(res, {
      message: "User updated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const listTransactions = async (req, res, next) => {
  try {
    const data = await service.listTransactions();
    sendSuccess(res, { data });
  } catch (error) {
    next(error);
  }
};

export const listCreditProfiles = async (req, res, next) => {
  try {
    const data = await service.listCreditProfiles();
    sendSuccess(res, { data });
  } catch (error) {
    next(error);
  }
};

export const updateCreditProfile = async (req, res, next) => {
  try {
    const data = await service.updateCreditProfile(req.params.userId, req.body);
    sendSuccess(res, {
      message: "Credit profile updated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const listLoans = async (req, res, next) => {
  try {
    const data = await service.listLoans();
    sendSuccess(res, { data });
  } catch (error) {
    next(error);
  }
};

export const getLoanDetails = async (req, res, next) => {
  try {
    const data = await service.getLoanDetails(req.params.loanId);
    sendSuccess(res, { data });
  } catch (error) {
    next(error);
  }
};

export const updateLoan = async (req, res, next) => {
  try {
    const data = await service.updateLoan(req.params.loanId, req.body);
    sendSuccess(res, {
      message: "Loan updated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getNotificationsWorkspace = async (req, res, next) => {
  try {
    const data = await service.getNotificationsWorkspace();
    sendSuccess(res, { data });
  } catch (error) {
    next(error);
  }
};

export const sendNotification = async (req, res, next) => {
  try {
    const data = await service.sendNotification(req.body);
    sendSuccess(res, {
      statusCode: 201,
      message: "Notification sent successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getReports = async (req, res, next) => {
  try {
    const data = await service.getReports();
    sendSuccess(res, { data });
  } catch (error) {
    next(error);
  }
};
