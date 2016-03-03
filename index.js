var irc = require("irc"),
    twitchApi = require("twitch-api"),
    settings = require("./settings"),
    sixGaming = require("./sixgaming"),
    client = new irc.Client(settings.irc.server, settings.irc.nick, settings.irc.options),
    twitch = new twitchApi(settings.twitch);

sixGaming.start(client, twitch);
