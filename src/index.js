require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client();
const prefix = process.env.PREFIX;
client.once('ready', () => {
    console.log('Ready!');
});

client.on('message', async msg => {
    // General Oink Commands
    console.log('oink oink')
    if (msg.content.startsWith(prefix + `pig`)) {
        if (msg.member.voice.channel) {
            const connection = await msg.member.voice.channel.join();
            connection.play('./src/sounds/mp3_466292.mp3', { volume: 1 });
        }
    }
});

client.login(process.env.TOKEN);