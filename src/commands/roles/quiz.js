const { guildID, roles: { bugHunter } } = require("../../config");
const Log = require("../../handlers/logging");

module.exports = {
    name: "quiz",
    category: "roles",
    description: "Sends the bug hunterquiz",
    roles: [],
    dmAllowed: true,
    run: async (client, message, args) => {
        await client.guilds.cache.get(guildID).members.fetch(message.author.id).catch(() => {});
        let m = client.guilds.cache.get(guildID).members.cache.get(message.author.id);
        if (!m) return;
        if (message.channel.type !== "dm") {
            message.delete({ timeout: 3000 });
            return message.reply("This command can only be used in DMs").then((msg) => msg.delete({ timeout: 3000 }));
        }

        if (m.roles.cache.has(bugHunter)) return message.reply("You are already a Bug Hunter!").then((msg) => msg.delete({ timeout: 3000 }));

        let code = randomString(22);
        await message.channel.send(`Here's your one time code \`${code}\`. Good luck!\n\n(Just send your code here as there's no Google Form)`);
        let received = (await message.channel.awaitMessages((m) => m.author.id === message.author.id, { max: 1, time: 60000 })).first().content;
        if (received !== code) return message.channel.send("Hey there aspiring Bug Hunter! You failed the quiz, but you can try again with the !quiz command.");
        Log.Send(
            client,
            `⬆️ **${m.user.username}**#${m.user.discriminator} (${m.id}) achieved the rank of Bug Hunter`
        );
        await m.roles.add(bugHunter);
        return message.channel.send(":star::star:Rank up!:star::star:\n:tada: Congratulations, you have achieved the rank of Bug Squasher!\n\nUnlocked:\n- Bug Hunter Announcements\n- Bug Hunter General Chat\n- Bug Submission");
    }
};

function randomString(length) {
    return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
}
