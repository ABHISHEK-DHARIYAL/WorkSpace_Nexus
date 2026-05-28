type Response = import("express").Response;



const sendSuccess = (res: Response, data: any, status = 200) => {
  return res.status(status).json(data);
};

const sendError = (res: Response, message: string, status = 500, code?: string) => {
  const response: any = { message };
  if (code) response.code = code;
  return res.status(status).json(response);
};


module.exports = {
  sendSuccess,
  sendError
};
