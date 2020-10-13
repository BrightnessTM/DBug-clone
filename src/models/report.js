const mongoose = require("mongoose");

const reportSchema = mongoose.Schema({
	reportID: String,
	userID: String,
	userTag: String,
	messageId: String,
	platform: String,
	title: String,
	stepsToReproduce: Array,
	expected: String,
	actual: String,
	system: String,
	client: String,
	approves: Array,
	denies: Array,
	notes: Array,
	attachmentUrl: Array,
	attachmentName: Array,
	stance: String,
	reportDate: Date,
});

module.exports = mongoose.model("Report", reportSchema);
