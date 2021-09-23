const { executionAsyncResource } = require('async_hooks');
const Discord = require('discord.js');
const ytdl = require('ytdl-core');

const { token } = require("./config.json");

const { YTSearcher } = require('ytsearcher');

const searcher = new YTSearcher({
    key: "AIzaSyCeHt9RE1-lqolWtvUt8SPtaWUxSnrV3KA",
    revealed: true
});

const client = new Discord.Client();

const queue = new Map();

client.on("ready", () => {
    console.log("yo we boutta inspect some femboys bro")   
})

client.on("message", async(message) => {
    const prefix = '!';

    const serverQueue = queue.get(message.guild.id);

    const args = message.content.slice(prefix.length).trim().split(/ + /g)
    const command = args.shift().toLowerCase();

    switch (command) {
        case 'play':
            execute(message, serverQueue);
            break;
        case 'stop':
            stop(message, serverQueue);
            break;
        case 'skip':
            skip(message, serverQueue);
            break;
    }


    async function execute(message, serverQueue){
        let vc = message.member.voice.channel;
        if(!vc){
            return message.channel.send("ur literally not in a channel rn, you have the situational awareness of helen keller");
        }else{
            let result = await searcher.search(args.join(" "), { type: "video" })
            message.channel.send(result.first.url);
            const songInfo = await ytdl.getInfo(result.first.url)

            let song = {
                title: songInfo.videoDetails.title,
                url: songInfo.videoDetails.video_url
            };

            if(!serverQueue){
                const queueConstructor = {
                    txtChannel: message.channel,
                    vChannel: vc,
                    connection: null,
                    songs: [],
                    volume: 10,
                    playing: true
                };
                queue.set(message.guild.id, queueConstructor);

                queueConstructor.songs.push(song);

                try{
                    let connection = await vc.join();
                    queueConstructor.connection = connection;
                    play(message.guild, queueConstructor.songs[0]);
                }catch (err){
                    console.error(err);
                    queue.delete(message.guild.id);
                    return message.channel.send(`i cant join voice ${err}`)
                }
            }else{
                serverQueue.songs.push(song);
                return message.channel.send(`really dude, this is what you want to queue? okay i'll queue ${song.url} ig :neutral_face: `);
            }
        }
    }
    function play(guild, song){
        const serverQueue = queue.get(guild.id);
        if(!song){
            serverQueue.vChannel.leave();
            queue.delete(guild.id);
            return;
        }
        const dispatcher = serverQueue.connection
            .play(ytdl(song.url))
            .on('finish', () =>{
                serverQueue.songs.shift();
                play(guild, serverQueue.songs[0]);
            })
            serverQueue.txtChannel.send(`this garbage is playing ${serverQueue.songs[0].url}`)
    }
    function stop (message, serverQueue){
        if(!message.member.voice.channel)
            return message.channel.send("dude, not only are you weird, but you also smell bad and nobody likes you, cringe. <insert your mom joke here> ")
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end();
    }
    function skip (message, serverQueue){
        if(!message.member.voice.channel)
            return message.channel.send("OMEGALUL nice try loser PepeLaugh L nerd :sunglasses:");
        if(!serverQueue)
            return message.channel.send("nothing is playing rn, ur actually 2Head or smth man");
        serverQueue.connection.dispatcher.end();
    }
})
client.login(token);