# Prompt Set
Create a list of prompts for a user to answer in any order!  
Allows you to lock specific prompts that require other prompts to be answered first and allows users to edit their responses and see their answers validated.  
Helpful for setting up a list of environment variables or prompting and validating credentials from a user.

## Installation
To install `prompt-set`, run `npm install prompt-set` or clone this repository and run `npm install`.

## Documentation
Documentation can be generated after installation with the command `npm run docs` and viewed on localhost by running `npm run servedocs`  
It is also served on the `docs` branch of this repository or the GitHub Pages site.

## Promptlet info object structure
##### Excluding Inquirer's Question object properties
You can safely assume that any property of the Inquirer.js question object will work the same way except for filter and validate (They have been wrapped so the code will still work either way).  
For a sample program, look at the `test.js` file
```json
{
	"optionName": "string",
	"name": "string",
	"message": "string",
	"type": "string (See inquirer documentation)",
	"default": "string|number|boolean|function",
	"prerequisites": ["string (Array of Prerequisite Promptlet names. Will NOT be validated)"],
	"validate": ["Functions/Validators.js exports. Overrides Inquirer's validate property"],
	"filter": ["Functions/Filters.js exports. Overrides Inquirer's filter property"],
	"allowBlank": "boolean",
	"autoTrim": "boolean",
	"value": "string",
	"editable": "boolean",
	"required": "boolean"
}
```