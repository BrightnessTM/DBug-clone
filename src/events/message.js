const fs = require("fs");
const json = fs.readFileSync("./src/config.json");

module.exports = async (client, message) => {
	const config = JSON.parse(json);
	if (message.guild && config.guildID !== message.guild.id) return;
	let prefix = config.prefix;

	if (message.author.bot) return;
	if (!message.guild) return;
	if (!message.content.startsWith(prefix)) return;
	if (!message.member)
		message.member = await message.guild.fetchMember(message);

	const args = message.content.slice(prefix.length).trim().split(/ +/g);
	const cmd = args.shift().toLowerCase();

	if (cmd.length === 0) return;

	let command = client.commands.get(cmd);
	if (!command) command = client.commands.get(client.aliases.get(cmd));

	if (command) {
		let allowed = false;
		if (command.roles.length === 0) allowed = true;
		command.roles.forEach((r) => {
			if (message.member.roles.cache.has(r)) allowed = true;
		});
		if (allowed) command.run(client, message, args);
		else
			return message.channel
				.send("🔒 Missing permissions ")
				.then((msg) => msg.delete({ timeout: 3000 }));
	}
};
