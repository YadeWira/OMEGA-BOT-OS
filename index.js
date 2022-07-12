
//@Wira

const Discord = require("discord.js");
const config = require('./config/config.json');
const enMap = require('enmap');
const mapped = new Map();

const client = new Discord.Client({
    partials: ["MESSAGE", "CHANNEL", "REACTION"],
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES, 
        Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS, 
        Discord.Intents.FLAGS.GUILD_MEMBERS, 
        Discord.Intents.FLAGS.GUILD_VOICE_STATES
    ]
});

client.on("ready", () => {
    console.log(`${client.user.tag} Activado`)
});

// Crear & Borrar Chat de Voz -----------------------------------------------------------
client.on("voiceStateUpdate", (oldState, newState) => {

    // Crear
    if(!oldState.channelId && newState.channelId) {
        if(newState.channelId == "994798608866082846") cSala(newState)
    }

    // Borrar
    if(oldState.channelId && !newState.channelId) {
        if(mapped.get(`temp_${oldState.guild.id}_${oldState.channelId}`)) {
            let cVoz = oldState.guild.channels.cache.get(mapped.get(`temp_${oldState.guild.id}_${oldState.channelId}`))

            if(cVoz) {
                if(cVoz.members.size < 1) {
                    cVoz.delete()
                    mapped.delete(`temp_${oldState.guild.id}_${oldState.channelId}`)
                }
            }
        }
    }

    // Crear o borrar mientras de mueves en Chats de Voz
    if(oldState.channelId && newState.channelId){
        if(oldState.channelId !== newState.channelId) {

            if(newState.channelId == "994798608866082846") cSala(newState)

            if(mapped.get(`temp_${oldState.guild.id}_${oldState.channelId}`)) {
                let cVoz = oldState.guild.channels.cache.get(mapped.get(`temp_${oldState.guild.id}_${oldState.channelId}`))
    
                if(cVoz) {
                    if(cVoz.members.size < 1) {
                        cVoz.delete()
                        mapped.delete(`temp_${oldState.guild.id}_${oldState.channelId}`)
                    }
                }

            }
        }
    }

});

async function cSala(newState) {
    newState.guild.channels.create(`Sala de ${newState.member.user.username}`, {
        type: "GUILD_VOICE",
        parent: newState.channel.parent
    }).then(canal => {
        newState.member.voice.setChannel(canal)
        mapped.set(`temp_${newState.guild.id}_${canal.id}`, canal.id)
    })
}

// Sistema de Bienvenida -----------------------------------------------------------

client.setups = new enMap({
    name: "setups",
    dataDir: "./databases"
});

client.on("messageCreate", async (message) => {

    if(message.author.bot || !message.guild || !message.channel) return;

    client.setups.ensure(message.guild.id, {
        welcomechannel: "",
        welcomemessage: "",
    })

    const args = message.content.slice(config.prefix.length).trim().split(" ");
    const command = args.shift()?.toLowerCase();

    if(command == "welcome"){

        const channel = message.guild.channels.cache.get(args[0]) || message.mentions.channels.first();

        if(!channel) return message.reply(`\`El Canal no Existe\``);
        if(!args.slice(1).join(" ")) return message.reply(`\`No has especificado un mensaje\``);

        let obj = {
            welcomechannel: channel.id,
            welcomemessage: args.slice(1).join(" "),
        }

        client.setups.set(message.guild.id, obj)
        return message.reply(`Listo, se a configurado el Canal de Bienvenida\n**Canal:** ${channel}\n**Mensaje:** ${args.slice(1).join(" ")}`)

    }
    
});

client.on("guildMemberAdd", async (member) => {

    client.setups.ensure(member.guild.id, {
        welcomechannel: "",
        welcomemessage: "",
    });

    try {
        const data = client.setups.get(member.guild.id);
        if (data) {
            if(member.guild.channels.cache.get(data.welcomechannel)){

                const channel = member.guild.channels.cache.get(data.welcomechannel)
                const Canvas = require("canvas")
                const canvas = Canvas.createCanvas(1018, 468)
                const ctx = canvas.getContext("2d")

                const background = await Canvas.loadImage("https://i.imgur.com/Phexq4K.jpg")
                ctx.drawImage(background, 0, 0, canvas.width, canvas.height)

                ctx.fillStyle = "#ffffff"
                ctx.font = "90px Comic Sans MS"

                ctx.fillText("Bienvenid@", 460, 220)
                ctx.fillText(`${member.user.username}`, 460, 320)

                ctx.beginPath()
                ctx.arc(247, 238, 175, 0, Math.PI * 2, true)
                ctx.closePath()
                ctx.clip()

                const avatar = await Canvas.loadImage(member.user.displayAvatarURL({format: "jpg", size: 1024, dynamic: true})) 
                ctx.drawImage(avatar, 72, 63, 350, 350)

                const attachments = new Discord.MessageAttachment(canvas.toBuffer(), "bienvenida-img.jpg")
                channel.send({content: data.welcomemessage.replace(/{usuario}/, member), files: [attachments]})

            }
        }
    } catch (e){console.log(e)}
    
});

// Ping -----------------------------------------------------------

client.on("messageCreate", async(message) => {

    if(message.author.bot || !message.guild || !message.channel) return;

    const args = message.content.slice(config.prefix.length).trim().split(" ");
    const command = args.shift()?.toLowerCase();

    if(command == "ping"){
        return message.reply(`Mi Ping es de \`${client.ws.ping}ms\``);
    }

});

client.login(config.token)