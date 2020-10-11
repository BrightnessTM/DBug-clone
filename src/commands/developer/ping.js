module.exports = {
	name: "ping",
	category: "botinfo",
	description: "Returns bot and API latency in milliseconds.",
	roles: ["763860080772775976", "763860111176237057"],
	run: async (client, message, _args) => {
		return message.channel.send(`🏓 Pong!\n**API:** ${client.ws.ping} ms : **Latency:** ${Math.floor(message.createdTimestamp - new Date().getTime())}`)
	},
};
