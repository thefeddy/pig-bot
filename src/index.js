require('dotenv').config();

const prefix = process.env.PREFIX;

const Discord = require('discord.js');
const client = new Discord.Client();

const https = require('https'); // or 'https' for https:// URLs
const fs = require('fs');
const url = require('url');
const path = require('path');

const mongoClient = require('mongodb').MongoClient;
const mongoURL = process.env.MONGODB_URL;


let commandList = [];

client.once('ready', () => {
    console.log(require('path').join(__dirname, ''))
    mongoClient.connect(mongoURL, function (err, db) {
        if (err) throw err;
        db.db('pig').collection('sounds').find({}).toArray(function (err, result) {
            if (err) throw err;
            commandList = result;
            db.close();
        });

    });
    console.log('Ready!');
});

client.on('message', async msg => {
    // General Oink Commands
    console.log('oink oink')
    if (msg.member.voice.channel) {
        const command = msg.content.replace('!', '')
        const playSound = commandList.find(object => object.alias === command);

        if (playSound) {
            const connection = await msg.member.voice.channel.join();
            const dispatcher = connection.play(path.join(__dirname, `sounds/${playSound.sound}`), { volume: 0.5 });
            dispatcher.on('start', () => {
                console.log('audio.mp3 is now playing!');
            });

            dispatcher.on('finish', () => {
                console.log('audio.mp3 has finished playing!');
            });
        }
        console.log(playSound)
    }

    if (msg.content.startsWith(prefix + `add`)) {
        const content = msg.content.split(' ');
        const sound = content[1];
        const alias = content[2];
        const parsed = url.parse(sound);
        const name = path.basename(parsed.pathname);

        const file = fs.createWriteStream(`${process.env.MEDIA}/${name}`);
        const request = https.get(sound, function (response) {
            response.pipe(file);
        })

        file.on('finish', () => {
            file.close();  // close() is async, call cb after close completes.

            mongoClient.connect(mongoURL, (err, db) => {
                if (err) throw err;
                const pigSound = { alias, sound: `${name}` };
                db.db('pig').collection('sounds').insertOne(pigSound, function (err, res) {
                    if (err) throw err;
                    commandList.push({ pigSound });
                    db.close();
                });

            });
        });

        request.on('error', function (err) { // Handle errors
            fs.unlink(`${process.env.MEDIA}/${name}`); // Delete the file async. (But we don't check the result)
            if (cb) cb(err.message);
        });;
    }
});

client.login(process.env.TOKEN);