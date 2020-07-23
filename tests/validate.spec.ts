import { expect } from "chai";
import "mocha";
import { recaptchaValidate } from "../src";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { ResponseFormatter } from "../src/index.d";
import rewire from "rewire";
const successResponse = { statusCode: 200, body: "Success" };
const fakeHandler = async (
  _event: APIGatewayProxyEvent | undefined,
  _context: Context | undefined
): Promise<APIGatewayProxyResult> => {
  return successResponse;
};

//@ts-ignore
describe("aws-lambda-recaptcha recaptchaValidate", () => {
  it("error with empty event default formatter and message", async () => {
    let returnedFn = recaptchaValidate(fakeHandler, {});
    expect(
      //@ts-ignore
      await returnedFn({}, {}, null)
    ).to.eql({
      statusCode: 500,
      body: JSON.stringify({
        message: "There was an error validating recaptcha",
      }),
    });
  });
  it("error with malformed body default formatter and message", async () => {
    let returnedFn = recaptchaValidate(fakeHandler, {});
    expect(
      //@ts-ignore
      await returnedFn({ body: '{"key":1' }, {}, null)
    ).to.eql({
      statusCode: 500,
      body: JSON.stringify({
        message: "There was an error validating recaptcha",
      }),
    });
  });
  it("error with empty event and cors true default formatter and message", async () => {
    let returnedFn = recaptchaValidate(fakeHandler, { cors: true });
    expect(
      //@ts-ignore
      await returnedFn({}, {}, null)
    ).to.eql({
      statusCode: 500,
      body: JSON.stringify({
        message: "There was an error validating recaptcha",
      }),
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  });
  it("error with empty event and cors is invalid type default formatter and message", async () => {
    // @ts-ignore
    let returnedFn = recaptchaValidate(fakeHandler, { cors: 2 });
    expect(
      //@ts-ignore
      await returnedFn({}, {}, null)
    ).to.eql({
      statusCode: 500,
      body: JSON.stringify({
        message: "There was an error validating recaptcha",
      }),
    });
  });
  it("error with empty event and cors true default formatter custom message", async () => {
    const message = { response: "Custom error message" };
    let returnedFn = recaptchaValidate(fakeHandler, {
      cors: true,
      errorMessage: message,
    });
    expect(
      //@ts-ignore
      await returnedFn({}, {}, null)
    ).to.eql({
      statusCode: 500,
      body: JSON.stringify(message),
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  });
  it("error with empty event and cors true custom formatter custom message", async () => {
    const message = { response: "Custom error message" };
    const formatterResponse = {
      statusCode: 200,
      body: JSON.stringify(message),
    };
    const customFormatter: ResponseFormatter = (
      data: string | object,
      statusCode: number
    ) => {
      expect(data).to.eql(message);
      expect(statusCode).to.equal(500);
      return formatterResponse;
    };
    let returnedFn = recaptchaValidate(fakeHandler, {
      cors: true,
      responseFormatter: customFormatter,
      errorMessage: message,
    });
    expect(
      //@ts-ignore
      await returnedFn({}, {}, null)
    ).to.eql(formatterResponse);
  });
  it("error with empty event and cors as an object default formatter and message", async () => {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "X-Test-Header": "testVal",
    };
    let returnedFn = recaptchaValidate(fakeHandler, { cors: headers });
    expect(
      //@ts-ignore
      await returnedFn({}, {}, null)
    ).to.eql({
      statusCode: 500,
      body: JSON.stringify({
        message: "There was an error validating recaptcha",
      }),
      headers: headers,
    });
  });
  it("error siteKey present no user key default formatter and message", async () => {
    let returnedFn = recaptchaValidate(fakeHandler, { siteKey: "1234" });
    expect(
      //@ts-ignore
      await returnedFn({ body: undefined }, {}, null)
    ).to.eql({
      statusCode: 400,
      body: JSON.stringify({
        message: "There was an error validating recaptcha",
      }),
    });
    expect(
      //@ts-ignore
      await returnedFn({ body: JSON.stringify({ key: "value" }) }, {}, null)
    ).to.eql({
      statusCode: 400,
      body: JSON.stringify({
        message: "There was an error validating recaptcha",
      }),
    });
  });
  it("failed siteKey present user key present", async () => {
    const mockedModule = rewire("../src/index");
    const siteKey = "SiteKey";
    const userToken = "UserToken";
    let called = false;
    let isValidRecaptcha = (secret: string, userToken: string) => {
      called = true;
      expect(secret).to.equal(siteKey);
      expect(userToken).to.equal(userToken);
      return false;
    };

    const revert = mockedModule.__set__({ isValidRecaptcha });
    const recaptchaValidateMock = mockedModule.recaptchaValidate;
    let returnedFn = recaptchaValidateMock(fakeHandler, { siteKey: siteKey });
    expect(
      await returnedFn(
        //@ts-ignore
        { body: JSON.stringify({ "g-recaptcha-response": userToken }) },
        {},
        null
      )
    ).to.eql({
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid recaptcha response" }),
    });
    expect(called).to.be.true;
    revert();
  });
  it("success siteKey present user key present", async () => {
    const mockedModule = rewire("../src/index");
    const siteKey = "SiteKey";
    const userToken = "UserToken";
    let called = false;
    let isValidRecaptcha = (secret: string, userToken: string) => {
      called = true;
      expect(secret).to.equal(siteKey);
      expect(userToken).to.equal(userToken);
      return true;
    };

    const revert = mockedModule.__set__({ isValidRecaptcha });
    const recaptchaValidateMock = mockedModule.recaptchaValidate;
    let returnedFn = recaptchaValidateMock(fakeHandler, { siteKey: siteKey });
    expect(
      await returnedFn(
        //@ts-ignore
        { body: JSON.stringify({ "g-recaptcha-response": userToken }) },
        {},
        null
      )
    ).to.eql(successResponse);
    expect(called).to.be.true;
    revert();
  });
  it("success parameterStoreKey present user key present", async () => {
    const siteKey = "SiteKey";
    const mockedModule = rewire("../src/index");
    const userToken = "UserToken";
    const parameterStoreKey = "ParameterStoreKey";
    let validCalled = false;
    let getKeyCalled = false;

    const isValidRecaptcha = (secret: string, userToken: string) => {
      validCalled = true;
      expect(secret).to.equal(siteKey);
      expect(userToken).to.equal(userToken);
      return true;
    };
    const getKeyFromParameterStore = (path: string) => {
      getKeyCalled = true;
      expect(path).to.equal(parameterStoreKey);
      return siteKey;
    };
    const revert = mockedModule.__set__({
      isValidRecaptcha,
      getKeyFromParameterStore,
    });
    const recaptchaValidateMock = mockedModule.recaptchaValidate;

    let returnedFn = recaptchaValidateMock(fakeHandler, { parameterStoreKey });
    expect(
      await returnedFn(
        //@ts-ignore
        { body: JSON.stringify({ "g-recaptcha-response": userToken }) },
        {},
        null
      )
    ).to.eql(successResponse);
    expect(validCalled, "isValidRecaptcha was not called").to.be.true;
    expect(getKeyCalled, "getKeyFromParameterStore was not called").to.be.true;
    revert();
  });
});
