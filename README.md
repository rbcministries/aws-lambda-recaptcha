## AWS Lambda Recaptcha
### Description
This package makes it very simple to add server side validation of google recaptcha to an AWS Lambda function that is run from APIGateway.
### Usage
To use this all you need to do is import/require `recaptchaValidate` and wrap your lambda function with it
```typescript
import {recaptchaValidate} from 'aws-lambda-recaptcha'
const options = {siteKey:'<recaptcha key>'}
export const yourHandler = recaptchaValidate((event, context)=>{
//Your awesome logic
}, options)
```
To make your code cleaner you may want to use a named function to pass it in instead:
```typescript
import {recaptchaValidate} from 'aws-lambda-recaptcha'
const options = {siteKey:'<recaptcha key>'}
const yourFunction = (event, context)=>{
	//Your awesome logic
}
export const yourHandle = recaptchaValidate(yourFunction, options)
```
### Options parameter
There are several options that can be set using in the `options` parameter here is the type definition
```typescript
type OptionsParameter = {
	siteKey?: string;
	parameterStoreKey?: string;
	responseFormatter?: ResponseFormatter;
	errorMessage?: string | object;
	invalidMessage?: string;
	cors?: HeadersObject | boolean;
	logger?: Console;
	debug?: boolean;
}
```
#### siteKey
The google recaptcha site key you need to use. Either `siteKey` or `parameterStoreKey` are required, siteKey takes precedent.
#### parameterStoreKey
If you would like to store your google recaptcha key securely in AWS parameter store you can pass the key in with this parameter, and the library will retrieve it for you.  Ensure your lambda function has permission to access that parameter store key. If both `siteKey` and `parameterStoreKey` are present `siteKey` takes precedence and `parameterStoreKey` will be ignored.

#### errorMessage
By default, if there is an error while attempting to validate the body returned will be 
```json5
{
message: "There was an error validating recaptcha"
}
``` 
You can change this if you  pass in either and object or a string. If you pass in a string it will still return json like above with just a different message value. If you pass in an object that full object will replace the body.
#### invalidMessage
By default, if there were no errors, and the recaptcha validation fails the body will be:
```json5
{
message: "Invalid recaptcha response"
}
``` 
You can customize this response just like `errorMessage`
#### cors
In the event of an error or invalid recaptcha response the function does not add any cors headers.  You can either set `cors` to `true` and 
```json5
{ "Access-Control-Allow-Origin": "*" }
```
will be added to the `headers` return property.  If you want a different value or other headers you can pass in an object and `headers` will be set to what was passed in. 
#### responseFormatter
If you need more control over how error/invalid responses are formatted, you can pass in a function that will run. The type definition of the function is:
```typescript
(data:string | object, statusCode: number) => APIGatewayProxyResult
```
This function should return what you want to return from the lambda function in the case of error or invalid response 
#### logger
Not currently used will be used in the future to allow you to pass in a Console like object to handle logging and debugging.
#### debug
Not currently used. Will be used in the future to allow you to turn on logging debug statements.
