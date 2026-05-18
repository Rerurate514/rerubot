import { Events } from "discord.js";
import { client } from "./client.js";

client.once(Events.ClientReady, () => {
    console.log(`Ready! Logged in as ${client.user?.tag}`);
});
