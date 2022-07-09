# Prompt Set
<a href="https://www.npmjs.com/package/prompt-set"><img alt="npm" src="https://img.shields.io/npm/v/prompt-set?style=flat-square"></a>

Create a list of prompts for a user to answer in any order!  
Allows you to lock specific prompts that require other prompts to be answered first and allows users to edit their responses and see their answers validated.  
Helpful for setting up a list of environment variables or prompting and validating credentials from a user.

## Installation
To install `prompt-set`, run `npm install prompt-set` or clone this repository and run `npm install`.

## Documentation
Full documentation can be found [here on the GitHub Pages site](https://malee31.github.io/prompt-set/).  
It can also be generated locally by cloning this repository and running `npm run docs` and viewed by running `npm run servedocs`

## Promptlet info object structure
##### Excludes Inquirer's Question object properties
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