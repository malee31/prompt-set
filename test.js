const PromptSet = require(".");

// Create a new PromptSet instance. Equivalent to (new PromptSet.PromptSet())
const set = PromptSet.instance();

set.addNew({
		optionName: "First Option",
		name: "Opt 1",
		message: "Prompted Once",
		editable: true
	}).addNew({
		optionName: "Second Option",
		name: "Opt 2",
		message: "Prompted Twice"
	}).addNew({
		optionName: "Third Option",
		name: "Opt 3",
		message: "Prompted Thrice"
	}).addNew([
		{
			optionName: "Fourth Option",
			name: "Opt 4",
			message: "Array added"
		},
		PromptSet.entry({
			optionName: "Fifth Option",
			name: "Opt 5",
			message: "Array Added Part 2",
		})
			.required(true)
			.addPrerequisite("Opt 2")
			.addPrerequisite("Opt 3")
	]).setFinishMode(PromptSet.finishModes.choice);

set.start().then(console.log).then(() => {
	console.log(`PromptSet.toString(): ${set}`);
});