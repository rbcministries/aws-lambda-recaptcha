import { APIGatewayProxyResult } from "aws-lambda";

export type HeadersObject = {
  [header: string]: boolean | number | string;
};

export type ResponseFormatter = (
  data: string | { [key: string]: boolean | number | string },
  statusCode: number
) => APIGatewayProxyResult;

export type RecaptchaResponse = {
  success: boolean;
  challenge_ts: string;
  hostname: string;
  "error-codes"?: [];
};

export type OptionsParameter = {
  siteKey?: string;
  parameterStoreKey?: string;
  responseFormatter?: ResponseFormatter;
  errorMessage?: string | { [key: string]: boolean | number | string };
  invalidMessage?: string | { [key: string]: boolean | number | string };
  cors?: HeadersObject | boolean;
  logger?: Console;
  debug?: boolean;
};
