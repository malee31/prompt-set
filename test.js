const PromptSet = require(".");

// Create a new PromptSet instance. Equivalent to (new PromptSet.PromptSet())
const set = PromptSet.instance();

set.addNew({
		optionName: "First Option (Editable)",
		name: "Opt 1",
		message: "This is the first option (Editable)",
		editable: true
	}).addNew({
		optionName: "Second Option",
		name: "Opt 2",
		message: "This is the second option"
	}).addNew({
		optionName: "Third Option",
		name: "Opt 3",
		message: "This is the third option"
	}).addNew([
		{
			optionName: "Fourth Option",
			name: "Opt 4",
			message: "This is the fourth option"
		},
		PromptSet.entry({
			optionName: "Fifth Option (Required to finish and also requires #2 and #3 to be completed first)",
			name: "Opt 5",
			message: "This is the fifth option (Requires #2 and #3)",
		})
			.required(true)
			.addPrerequisite("Opt 2")
			.addPrerequisite("Opt 3")
	]).setFinishMode(PromptSet.finishModes.choice);

set.start().then(console.log).then(() => {
	console.log(`PromptSet.toString(): ${set}`);
});