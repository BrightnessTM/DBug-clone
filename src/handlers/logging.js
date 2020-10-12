const fs = require("fs");
const json = fs.readFileSync("./src/config.json");
const config = JSON.parse(json);

module.exports = {
	Send: (client, log) => {
		var date = new Date();
		var hour = date.getHours();
		var minute = date.getMinutes();

		/*client.channels.cache
			.get(config.channels.modLogs)
			.send(`\`\`[${hour}:${minute}]\`\` ${log}`);
			*/
	},
};
