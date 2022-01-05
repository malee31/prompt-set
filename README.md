# Prompt Set
Create a list of prompts for a user to answer in any order!<br>
Allows you to lock specific prompts so that they can only be answered after a different one and allows editing and validating answers.<br>
Helpful for setting up a list of environment variables or prompting and validating credentials from a user.

# Installation
To install `prompt-set`, simply clone this repository and run `npm install`.<br>
Optionally, test to make sure the code works by running `npm run test` afterwards.

# Documentation
Documentation can be generated after installation with the command `npm run docs` and viewed on localhost by running `npm run servedocs`<br>
It is also served on the `docs` branch of this repository or the GitHub Pages site.

# Promptlet info object structure
##### Excluding Inquirer's Question object properties
You can safely assume that any property of the Inquirer.js question object will work the same way except for filter and validate (They have been wrapped so the code will still work either way).
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