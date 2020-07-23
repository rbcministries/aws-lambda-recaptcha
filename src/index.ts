import axios from "axios";
import {
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  Context,
  APIGatewayProxyEvent,
} from "aws-lambda";
import AWS from "aws-sdk";
import { OptionsParameter, RecaptchaResponse } from "./index.d";
import { GetParameterResult } from "aws-sdk/clients/ssm";
const RECAPTCHA_URL = "https://www.google.com/recaptcha/api/siteverify";
const RECAPTCHA_METHOD = "POST";
export const recaptchaValidate = (
  func: (
    event?: APIGatewayProxyEvent,
    context?: Context
  ) => Promise<APIGatewayProxyResult>,
  options: OptionsParameter
): APIGatewayProxyHandler => {
  return async (
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> => {
    let returnResponse: APIGatewayProxyResult;
    const errorMessage: string | object =
      options.errorMessage || "There was an error validating recaptcha";
    let responseFn = options.responseFormatter;
    if (!responseFn) {
      responseFn = (
        message: object | string,
        statusCode: number
      ): APIGatewayProxyResult => {
        const res: APIGatewayProxyResult = responseFormatter(
          message,
          statusCode
        );
        if (options.cors) {
          if (typeof options.cors === "boolean") {
            res.headers = { "Access-Control-Allow-Origin": "*" };
          } else if (typeof options.cors === "object") {
            res.headers = options.cors;
          }
        }
        return res;
      };
    }
    try {
      const siteKey = await getSiteKeyFromOptions(options);
      const userToken: string = getUserToken(event.body);
      if (await isValidRecaptcha(siteKey, userToken)) {
        returnResponse = await func(event, context);
      } else {
        returnResponse = responseFn(
          options.invalidMessage || "Invalid recaptcha response",
          400
        );
      }
    } catch (e) {
      let statusCode = 500;
      if (e instanceof StatusError && e.status) {
        statusCode = e.status;
      }
      return responseFn(errorMessage, statusCode);
    }
    return returnResponse;
  };
};

function getKeyFromParameterStore(path: string): Promise<string> {
  const ssm = new AWS.SSM({ apiVersion: "2014-11-06" });
  return new Promise<string>((resolve, reject) => {
    let params = {
      Name: path,
      WithDecryption: true,
    };
    ssm.getParameter(params, (err, data: GetParameterResult) => {
      if (err) reject(err);
      if (!data.Parameter?.Value) reject("No value at given key");
      resolve(data.Parameter?.Value);
    });
  });
}

async function getSiteKeyFromOptions(
  options: OptionsParameter
): Promise<string> {
  let siteKey: string;

  if (options.siteKey) {
    siteKey = options.siteKey;
  } else if (options.parameterStoreKey) {
    siteKey = await getKeyFromParameterStore(options.parameterStoreKey);
  } else {
    throw getStatusError(
      "Either siteKey or parameterStoreKey is required",
      500
    );
  }
  return siteKey;
}

function getUserToken(body: string | null): string {
  let bodyObj: {
    "g-recaptcha-response": string;
    [key: string]: boolean | number | string;
  };
  if (!body) {
    throw getStatusError("Empty body, expecting body with JSON", 400);
  }
  bodyObj = JSON.parse(body);
  if (!bodyObj["g-recaptcha-response"]) {
    throw getStatusError("Body does not contain g-recaptcha-response", 400);
  }

  return bodyObj["g-recaptcha-response"];
}

async function isValidRecaptcha(
  secret: string,
  userToken: string
): Promise<boolean> {
  //@TODO replace axios with built-in functionality to reduce package size
  const verifyRes = await axios.request<RecaptchaResponse>({
    url: RECAPTCHA_URL,
    method: RECAPTCHA_METHOD,
    data: {
      secret,
      response: userToken,
    },
  });
  return verifyRes.data.success;
}

export function responseFormatter(
  message: string | object,
  statusCode: number
): APIGatewayProxyResult {
  const res: APIGatewayProxyResult = {
    statusCode,
    body: "",
  };
  if (typeof message === "object") {
    res.body = JSON.stringify(message);
  } else {
    res.body = JSON.stringify({ message });
  }
  return res;
}
function getStatusError(message: string, status: number) {
  const error = new StatusError(message);
  error.status = status;
  return error;
}
class StatusError extends Error {
  status?: number;
}
