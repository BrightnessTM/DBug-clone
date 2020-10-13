const Report = require("../../handlers/report");
const Log = require("../../handlers/logging");
const { channels: { androidBugs, desktopBugs, marketingBugs, iosBugs } } = require("../../config");

module.exports = {
	name: "submit",
	category: "report",
	description: "Reports a bug",
	roles: [],
	run: async (client, message, args) => {
		message.delete({ timeout: 3000 });
		if (![androidBugs, desktopBugs, marketingBugs, iosBugs].includes(message.channel.id)) return message
			.reply("This command can only be used in a bug report channel")
			.then((msg) => msg.delete({ timeout: 3000 }));

		let title = "", steps = "", actual = "", expected = "", clientSettings = "", systemSettings = "";
		let current = 0;

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

		if ([!title, !steps, !actual, !expected, !clientSettings, !systemSettings].includes(true))
			return message
				.reply("You must provide a title, steps to reproduce, actual result, expected result, client settings, and system settings. For assistance formatting your report, use <https://testersqts.github.io/bug-report-tool/>")
				.then((msg) => msg.delete({ timeout: 3000 }));

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

		return message.reply(":tada:").catch(err => {
        		if (err) return;
    		}).then(msg => {
        		if (msg) { msg.delete({ timeout: 3000 }).catch(err => { return err; }) }
    		});
	},
};
