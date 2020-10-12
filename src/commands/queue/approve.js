const Report = require("../../models/report");
const ReportHandler = require("../../handlers/report");
const fs = require("fs");

const json = fs.readFileSync("./src/config.json");
const Log = require("../../handlers/logging");
const config = JSON.parse(json);

const clc = require("cli-color");

module.exports = {
	name: "approve",
	category: "queue",
	description: "Approves a bug",
	roles: [],
	run: async (client, message, args) => {
		message.delete({ timeout: 3000 });
		if (args[0] === undefined)
			return message
				.reply("You forgot the report id")
				.then((msg) => msg.delete({ timeout: 3000 }));
		if (args[1] === undefined)
			return message
				.reply("You forgot a reason for the approve")
				.then((msg) => msg.delete({ timeout: 3000 }));

		const id = args[0];
		const aMessage = args.slice(1).join(" ");

		const r = async function (params) {
			try {
				return await Report.findOne(params);
			} catch (err) {
				console.error(clc.red(err));
			}
		};

		const foundReport = await r({ reportID: id });
		if (foundReport === null)
			return message
				.reply("Hmm that report doesnt exist :(")
				.then((msg) => msg.delete({ timeout: 3000 }));
		else if (foundReport.userID === message.author.id)
			return message
				.reply("You cannot approve your own report")
				.then((msg) => msg.delete({ timeout: 3000 }));
		else if (foundReport.stance === "Approved")
			return message
				.reply("This bug has already been approved.")
				.then((msg) => msg.delete({ timeout: 3000 }));
		else if (foundReport.stance === "Denied")
			return message
				.reply("This bug has been denied.")
				.then((msg) => msg.delete({ timeout: 3000 }));

		await Report.updateOne(
			{ _id: foundReport._id },
			{
				$push: {
					approves: `${config.emotes.green} ${message.author.username}#${message.author.discriminator}: ${aMessage}`,
				},
			}
		);

		ReportHandler.UpdateStance(client, await r({ reportID: id }));

		Log.Send(
			client,
			`✅ Bug \`\`#${foundReport.reportID}\`\` submitted by ${foundReport.userTag} (${foundReport.userID}) got **approved** by **${message.author.username}**#${message.author.discriminator} (${message.author.id})\n**Message:** ${aMessage}`
		);

		return message
			.reply(
				`${config.emotes.green} Approved \`\`#${id}\`\` with the message *${aMessage}*`
			)
			.then((msg) => msg.delete({ timeout: 3000 }));
	},
};
