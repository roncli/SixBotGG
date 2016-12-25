var Discord = require("discord.js"),
    Tmi = require("tmi.js"),
    TwitchApi = require("twitch-api"),
    settings = require("./settings"),
    sixGaming = require("./sixgaming"),
    tmi = new Tmi.client(settings.tmi),
    discord = new Discord.Client(settings.discord.options),
    twitch = new TwitchApi(settings.twitch);

sixGaming.start(tmi, discord, twitch);
