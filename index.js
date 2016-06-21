var Irc = require("irc"),
    Discord = require("discord.js"),
    TwitchApi = require("twitch-api"),
    settings = require("./settings"),
    sixGaming = require("./sixgaming"),
    irc = new Irc.Client(settings.irc.server, settings.irc.nick, settings.irc.options),
    discord = new Discord.Client(settings.discord.options),
    twitch = new TwitchApi(settings.twitch);

sixGaming.start(irc, discord, twitch);
