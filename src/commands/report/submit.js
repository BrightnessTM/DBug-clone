const Report = require("../../handlers/report");
const Log = require("../../handlers/logging");

module.exports = {
	name: "submit",
	category: "report",
	description: "Reports a bug",
	roles: [],
	run: async (client, message, args) => {
		message.delete({ timeout: 3000 });

		let current = 0;

		let title = "";
		let steps = "";
		let actual = "";
		let expected = "";
		let clientSettings = "";
		let systemSettings = "";

		for (let i = 0; i < args.length; i++) {
			switch (args[i]) {
				case "-t":
					current = 1;
					i++;
					break;
				case "-r":
					current = 2;
					i++;
					break;
				case "-e":
					current = 3;
					i++;
					break;
				case "-a":
					current = 4;
					i++;
					break;
				case "-c":
					current = 5;
					i++;
					break;
				case "-s":
					current = 6;
					i++;
					break;
				default:
					break;
			}
			if (current === 1) title += `${args[i]} `;
			else if (current === 2) steps += `${args[i]} `;
			else if (current === 3) actual += `${args[i]} `;
			else if (current === 4) expected += `${args[i]} `;
			else if (current === 5) clientSettings += `${args[i]} `;
			else if (current === 6) systemSettings += `${args[i]} `;
		}

		steps = steps.split("-");

		Report.Send(
			client,
			message,
			title,
			steps,
			actual,
			expected,
			clientSettings,
			systemSettings
		);

		Log.Send(
			client,
			`💡 New bug report with the title \`\`${title}\`\` submitted by **${message.author.username}**#${message.author.discriminator} (${message.author.id})`
		);

		return message.reply(":tada:").then((msg) => msg.delete({ timeout: 3000 }));
	},
};
