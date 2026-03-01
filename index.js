require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.db');

db.run(`CREATE TABLE IF NOT EXISTS claims (
  discordId TEXT PRIMARY KEY
)`);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`Bot online as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {

  if (message.channel.name !== "process-1000-gems-purc") return;
  if (message.author.bot) return;

  const discordId = message.author.id;
  const playfabId = message.content.trim();

  db.get("SELECT discordId FROM claims WHERE discordId = ?", [discordId], async (err, row) => {

    if (row) {
      message.reply("❌ You already claimed your 1000 gems.");
      return;
    }

    try {

      await axios.post(
        `https://${process.env.PLAYFAB_TITLE}.playfabapi.com/Server/AddUserVirtualCurrency`,
        {
          PlayFabId: playfabId,
          VirtualCurrency: "GEMS",
          Amount: 1000
        },
        {
          headers: {
            "X-SecretKey": process.env.PLAYFAB_SECRET
          }
        }
      );

      db.run("INSERT INTO claims(discordId) VALUES(?)", [discordId]);

      await message.reply("✅ 1000 Gems added!");
      await message.delete();

    } catch (error) {
      console.error(error.response?.data || error);
      message.reply("❌ Invalid PlayFab ID.");
    }

  });

});

client.login(process.env.DISCORD_TOKEN);
