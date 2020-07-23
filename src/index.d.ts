import { APIGatewayProxyResult, Context, APIGatewayProxyEvent } from 'aws-lambda';
export type OptionsParameter = {
	siteKey?: string;
	parameterStoreKey?: string;
	responseFormatter?: ResponseFormatter;
	errorMessage?: string | object;
	invalidMessage?: string | object;
	cors?: HeadersObject | boolean;
	logger?: Console;
	debug: boolean;
}

export type HeadersObject = {
	[header: string]: boolean | number | string;
}

export type ResponseFormatter = (data:string | object, statusCode: number) => APIGatewayProxyResult

export type RecaptchaResponse = {
	success: boolean;
	challenge_ts: string;
	hostname: string;
	"error-codes"?: []
}
