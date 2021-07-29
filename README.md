# Prompt Set
Create setup prompts for users that can be gone through in any order of their choosing as long as some prerequisites are met.<br>
Helpful for setting up a list of environment variables and prompting credentials from a user.

# Installation
To install Prompt Set, simply clone this repository and run `npm install`.<br>
Optionally, test to make sure the code works by running `npm run test` afterwards.

# Documentation
Documentation can be generated after installation with the command `npm run docs` and viewed on localhost by running `npm run servedocs`

# Promptlet info object structure
##### Excluding Inquirer's Question object properties
```json
{
	"validators": [Functions/Validators.js exports],
	"filters": [Functions/Filters.js exports],
	"prerequisites": [Name strings (Will not be double checked for existance)]
}
```