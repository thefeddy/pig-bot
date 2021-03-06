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

        if (!db.db('pig').collection('sounds').find()) {
            db.db('pig').createCollection('sounds', function (err, res) {
                if (err) throw err;
                console.log("Sounds created!");
                db.close();
            });
        }

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
        console.log(commandList)
        let playSound = commandList.find(object => object.alias === command);
        console.log(playSound)
        if (playSound) {
            const connection = await msg.member.voice.channel.join();
            const dispatcher = connection.play(path.join(__dirname, `sounds/${playSound.sound}`), { volume: 0.5 });
        }
    }

    if (msg.content.startsWith(prefix + `add`)) {
        const content = msg.content.split(' ');
        let sound = null;
        let alias = null;

        try {
            const soundURL = new URL(content[1]);
            sound = content[1];
            alias = content[2];

        } catch (error) {
            if (msg.attachments.first()) {//checks if an attachment is sent
                sound = msg.attachments.first().url;
                alias = content[1];
            }
        }

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
                    commandList.push(pigSound);

                    db.close();
                });

            });
        });

        request.on('error', function (err) { // Handle errors
            fs.unlink(`${process.env.MEDIA}/${name}`); // Delete the file async. (But we don't check the result)
            if (cb) cb(err.message);
        });
    }
});

client.login(process.env.TOKEN);