const {PromptSet, PromptSetClass} = require(".");

const set = PromptSet()
	.addNew({
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
		{
			optionName: "Fifth Option",
			name: "Opt 5",
			message: "Array Added Part 2",
			prerequisites: ["Opt 2", "Opt 3"],
			required: true
		}
	])
	.setFinishMode(PromptSetClass.finishModes.choice);

debugger;

set.start().then(console.log).then(() => {
	console.log(`PromptSet.toString(): ${set}`);
});