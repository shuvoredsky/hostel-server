"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResponse = void 0;
const sendResponse = (res, responseData) => {
    const { httpStatusCode, success, message, data, meta } = responseData;
    res.status(httpStatusCode).json({ success, message, data, meta });
};
exports.sendResponse = sendResponse;
