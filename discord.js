const DiscordJs = require("discord.js"),

    Commands = require("./commands"),
    Db = require("./database"),
    Exception = require("./exception"),
    Log = require("./log"),
    settings = require("./settings"),
    Tmi = require("./tmi"),
    Twitch = require("./twitch"),
    User = require("./user"),
    Warning = require("./warning"),

    discord = new DiscordJs.Client(/** @type {DiscordJs.ClientOptions} */ (settings.discord.options)), // eslint-disable-line no-extra-parens
    liveChannels = {},
    messageParse = /^!([^ ]+)(?: +(.+[^ ]))? *$/,
    urlParse = /^https:\/\/www.twitch.tv\/(.+)$/;

/**
 * @type {number[]}
 */
const hostingTimestamps = [];

/**
 * @type {string[]}
 */
const hosts = [];

/**
 * @type {Object<string, NodeJS.Timeout>}
 */
const channelDeletionTimeouts = {};

/**
 * @type {string[]}
 */
const streamers = [];

let currentHost = "",
    lastHost = 0,
    manualHosting = false,
    readied = false,
    wasEmptyLast = false;

/**
 * @type {Commands}
 */
let commands;

/**
 * @type {DiscordJs.TextChannel}
 */
let liveStreamAnnouncementsChannel;

/**
 * @type {DiscordJs.TextChannel}
 */
let sixBotGGChannel;

/**
 * @type {DiscordJs.Guild}
 */
let sixGuild;

/**
 * @type {DiscordJs.Role}
 */
let streamNotifyRole;

/**
 * @type {DiscordJs.CategoryChannel}
 */
let streamersCategory;

/**
 * @type {DiscordJs.Role}
 */
let streamersRole;

/**
 * @type {DiscordJs.CategoryChannel}
 */
let voiceCategory;

//  ####     #                                    #
//   #  #                                         #
//   #  #   ##     ###    ###    ###   # ##    ## #
//   #  #    #    #      #   #  #   #  ##  #  #  ##
//   #  #    #     ###   #      #   #  #      #   #
//   #  #    #        #  #   #  #   #  #      #  ##
//  ####    ###   ####    ###    ###   #       ## #
/**
 * A static class that handles all Discord.js interctions.
 */
class Discord {
    //                                        #
    //                                        #
    //  ##    ##   # #   # #    ###  ###    ###   ###
    // #     #  #  ####  ####  #  #  #  #  #  #  ##
    // #     #  #  #  #  #  #  # ##  #  #  #  #    ##
    //  ##    ##   #  #  #  #   # #  #  #   ###  ###
    /**
     * @returns {Commands} The commands object.
     */
    static get commands() {
        return commands;
    }

    //    #   #                                #
    //    #                                    #
    //  ###  ##     ###    ##    ##   ###    ###
    // #  #   #    ##     #     #  #  #  #  #  #
    // #  #   #      ##   #     #  #  #     #  #
    //  ###  ###   ###     ##    ##   #      ###
    /**
     * @returns {DiscordJs.Client} The Discord object.
     */
    static get discord() {
        return discord;
    }

    //                                      #    #  #                #
    //                                      #    #  #                #
    //  ##   #  #  ###   ###    ##   ###   ###   ####   ##    ###   ###
    // #     #  #  #  #  #  #  # ##  #  #   #    #  #  #  #  ##      #
    // #     #  #  #     #     ##    #  #   #    #  #  #  #    ##    #
    //  ##    ###  #     #      ##   #  #    ##  #  #   ##   ###      ##
    /**
     * Gets the current host.
     * @returns {string} The current host.
     */
    static get currentHost() {
        return currentHost;
    }

    /**
     * Sets the current host.
     * @param {string} value The current host.
     */
    static set currentHost(value) {
        currentHost = value;
    }

    //                               ##    #  #                #     #
    //                                #    #  #                #
    // # #    ###  ###   #  #   ###   #    ####   ##    ###   ###   ##    ###    ###
    // ####  #  #  #  #  #  #  #  #   #    #  #  #  #  ##      #     #    #  #  #  #
    // #  #  # ##  #  #  #  #  # ##   #    #  #  #  #    ##    #     #    #  #   ##
    // #  #   # #  #  #   ###   # #  ###   #  #   ##   ###      ##  ###   #  #  #
    //                                                                           ###
    /**
     * Gets whether manual hosting is active.
     * @returns {boolean} Whether manual hosting is active.
     */
    static get manualHosting() {
        return manualHosting;
    }

    /**
     * Sets whether manual hosting is active.
     * @param {boolean} value Whether manual hosting is active.
     */
    static set manualHosting(value) {
        manualHosting = value;
    }

    //  #
    //
    // ##     ##    ##   ###
    //  #    #     #  #  #  #
    //  #    #     #  #  #  #
    // ###    ##    ##   #  #
    /**
     * Six Gaming's icon.
     * @returns {string} The URL of the icon.
     */
    static get icon() {
        if (discord && discord.status === 0) {
            return discord.user.avatarURL;
        }

        return void 0;
    }

    //         #                 #
    //         #                 #
    //  ###   ###    ###  ###   ###   #  #  ###
    // ##      #    #  #  #  #   #    #  #  #  #
    //   ##    #    # ##  #      #    #  #  #  #
    // ###      ##   # #  #       ##   ###  ###
    //                                      #
    /**
     * Starts up the connection to Discord.
     * @returns {void}
     */
    static startup() {
        commands = new Commands(Discord);

        discord.on("ready", () => {
            Log.log("Connected to Discord.");

            sixGuild = discord.guilds.find((g) => g.name === "Six Gaming");

            liveStreamAnnouncementsChannel = /** @type {DiscordJs.TextChannel} */ (sixGuild.channels.find((c) => c.name === "live-stream-announcements")); // eslint-disable-line no-extra-parens
            sixBotGGChannel = /** @type {DiscordJs.TextChannel} */ (sixGuild.channels.find((c) => c.name === "sixbotgg")); // eslint-disable-line no-extra-parens

            streamersCategory = /** @type {DiscordJs.CategoryChannel} */ (sixGuild.channels.find((c) => c.name === "Streamers")); // eslint-disable-line no-extra-parens
            voiceCategory = /** @type {DiscordJs.CategoryChannel} */ (sixGuild.channels.find((c) => c.name === "Voice")); // eslint-disable-line no-extra-parens

            streamersRole = sixGuild.roles.find((r) => r.name === "Streamers");
            streamNotifyRole = sixGuild.roles.find((r) => r.name === "Stream Notify");

            // Start deleting old Discord channels.
            sixGuild.channels.filter((channel) => channel.type === "voice").forEach((/** @type {DiscordJs.VoiceChannel} */ channel) => {
                if (channel.name !== "\u{1F4AC} General" && channel.members.size === 0) {
                    Discord.markEmptyVoiceChannel(channel);
                }
            });

            if (!readied) {
                readied = true;
                Discord.checkStreams();
            }
        });

        discord.on("disconnect", (err) => {
            Log.exception("Disconnected from Discord.", err);
        });

        discord.on("message", async (message) => {
            if (message.guild && message.guild.name === "Six Gaming" && message.channel instanceof DiscordJs.TextChannel && message.channel.name === "sixbotgg" && message.channel.type === "text") {
                await Discord.message(message.author, message.content);
            }
        });

        discord.on("voiceStateUpdate", (oldMember, newMember) => {
            if (oldMember.voiceChannel) {
                if (oldMember.voiceChannel.name !== "\u{1F4AC} General" && oldMember.voiceChannel.members.size === 0) {
                    Discord.markEmptyVoiceChannel(oldMember.voiceChannel);
                }
            }

            if (newMember.voiceChannel) {
                if (channelDeletionTimeouts[newMember.voiceChannel.id]) {
                    clearTimeout(channelDeletionTimeouts[newMember.voiceChannel.id]);
                    delete channelDeletionTimeouts[newMember.voiceChannel.id];
                }
            }
        });

        discord.on("presenceUpdate", (oldMember, newMember) => {
            if (newMember.presence && newMember.presence.game && newMember.presence.game.streaming && newMember.presence.game.url && newMember.presence.game.url.includes("twitch.tv")) {
                const matches = urlParse.exec(newMember.presence.game.url);

                if (matches) {
                    const user = matches[1];

                    Db.streamerExistsByDiscord(newMember.id).then((exists) => {
                        if (!exists) {
                            Db.addStreamer(user, newMember.id).then(() => {
                                Db.deleteHostByUser(user).then(() => {
                                    Discord.addStreamersRole(newMember);

                                    Discord.queue(`${newMember}, you are now setup as a Six Gaming streamer at http://twitch.tv/${user}.  If you would like a text channel on Discord for your Twitch community, you can use \`!addmychannel\`.`);
                                    Discord.addStreamer(user);
                                    Discord.removeHost(user);
                                }).catch((err) => {
                                    Log.exception("There was a database error while removing a hosted streamer after becoming a Six Gaming streamer.", err);
                                });
                            }).catch((err) => {
                                Log.exception("There was a database error inserting into the streamer table.", err);
                            });
                        }
                    }).catch((err) => {
                        Log.exception(`Error while checking if ${newMember} is a streamer.`, err);
                    });
                }
            }
        });
    }

    //                                      #
    //                                      #
    //  ##    ##   ###   ###    ##    ##   ###
    // #     #  #  #  #  #  #  # ##  #      #
    // #     #  #  #  #  #  #  ##    #      #
    //  ##    ##   #  #  #  #   ##    ##     ##
    /**
     * Connects to Discord.  Should only ever be called once.
     * @returns {void}
     */
    static connect() {
        Log.log("Connecting to Discord...");

        discord.login(settings.discord.token).then(() => {
            Log.log("Connected.");
        }).catch((err) => {
            Log.exception("Error connecting to Discord, will automatically retry.", err);
        });

        discord.on("error", (err) => {
            Log.exception("Discord error.", err);
        });
    }

    //  #            ##                                  #             #
    //              #  #                                 #             #
    // ##     ###   #      ##   ###   ###    ##    ##   ###    ##    ###
    //  #    ##     #     #  #  #  #  #  #  # ##  #      #    # ##  #  #
    //  #      ##   #  #  #  #  #  #  #  #  ##    #      #    ##    #  #
    // ###   ###     ##    ##   #  #  #  #   ##    ##     ##   ##    ###
    /**
     * Determines whether the bot is connected to Discord.
     * @returns {boolean} Whether the bot is connected to Discord.
     */
    static isConnected() {
        return discord && sixGuild ? discord.status === 0 : false;
    }

    // # #    ##    ###    ###    ###   ###   ##
    // ####  # ##  ##     ##     #  #  #  #  # ##
    // #  #  ##      ##     ##   # ##   ##   ##
    // #  #   ##   ###    ###     # #  #      ##
    //                                  ###
    /**
     * Parses a message.
     * @param {DiscordJs.User} user The user who sent the message.
     * @param {string} message The text of the message.
     * @returns {Promise} A promise that resolves when the message is parsed.
     */
    static async message(user, message) {
        const member = Discord.findGuildUserById(user.id);

        if (!member) {
            return;
        }

        for (const text of message.split("\n")) {
            if (messageParse.test(text)) {
                const matches = messageParse.exec(text),
                    command = matches[1].toLocaleLowerCase(),
                    args = matches[2];

                if (Object.getOwnPropertyNames(Commands.prototype).filter((p) => typeof Commands.prototype[p] === "function" && p !== "constructor").indexOf(command) !== -1) {
                    let success;
                    try {
                        await Discord.commands[command](new User(member), args);
                    } catch (err) {
                        if (err instanceof Warning) {
                            Log.warning(`${member}: ${text}\n${err}`);
                        } else if (err instanceof Exception) {
                            Log.exception(err.message, err.innerError);
                        } else {
                            Log.exception("Unhandled error found.", err);
                        }

                        return;
                    }

                    if (success) {
                        Log.log(`${member}: ${text}`);
                    }
                }
            }
        }
    }

    //  ###  #  #   ##   #  #   ##
    // #  #  #  #  # ##  #  #  # ##
    // #  #  #  #  ##    #  #  ##
    //  ###   ###   ##    ###   ##
    //    #
    /**
     * Queues a message to be sent.
     * @param {string} message The message to be sent.
     * @param {DiscordJs.TextChannel|DiscordJs.DMChannel|DiscordJs.GroupDMChannel|DiscordJs.GuildMember} [channel] The channel to send the message to.
     * @returns {Promise<DiscordJs.Message>} A promise that resolves with the sent message.
     */
    static async queue(message, channel) {
        if (!channel) {
            channel = sixBotGGChannel;
        }

        if (channel.id === discord.user.id) {
            return void 0;
        }

        let msg;
        try {
            msg = await Discord.richQueue(new DiscordJs.RichEmbed({description: message}), channel);
        } catch {}
        return msg;
    }

    //        #          #      ##
    //                   #     #  #
    // ###   ##     ##   ###   #  #  #  #   ##   #  #   ##
    // #  #   #    #     #  #  #  #  #  #  # ##  #  #  # ##
    // #      #    #     #  #  ## #  #  #  ##    #  #  ##
    // #     ###    ##   #  #   ##    ###   ##    ###   ##
    //                            #
    /**
     * Queues a rich embed message to be sent.
     * @param {DiscordJs.RichEmbed} embed The message to be sent.
     * @param {DiscordJs.TextChannel|DiscordJs.DMChannel|DiscordJs.GroupDMChannel|DiscordJs.GuildMember} [channel] The channel to send the message to.
     * @returns {Promise<DiscordJs.Message>} A promise that resolves with the sent message.
     */
    static async richQueue(embed, channel) {
        if (!channel) {
            channel = sixBotGGChannel;
        }

        if (channel.id === discord.user.id) {
            return void 0;
        }

        embed.setFooter(embed.footer ? embed.footer.text : "", Discord.icon);

        if (embed && embed.fields) {
            embed.fields.forEach((field) => {
                if (field.value && field.value.length > 1024) {
                    field.value = field.value.substring(0, 1024);
                }
            });
        }

        if (!embed.color) {
            embed.setColor(0x16F6F8);
        }

        if (!embed.timestamp) {
            embed.setTimestamp(new Date());
        }

        let msg;
        try {
            msg = await channel.send("", embed);

            if (msg instanceof Array) {
                msg = msg[0];
            }
        } catch {}
        return msg;
    }

    //  #           ###            #                      #
    //              #  #           #                      #
    // ##     ###   #  #   ##    ###   ##    ###   ###   ###    ##   ###
    //  #    ##     ###   #  #  #  #  #     #  #  ##      #    # ##  #  #
    //  #      ##   #     #  #  #  #  #     # ##    ##    #    ##    #
    // ###   ###    #      ##    ###   ##    # #  ###      ##   ##   #
    /**
     * Determins whether the user is a podcaster.
     * @param {DiscordJs.GuildMember} user The user to check.
     * @returns {boolean} Whether the user is a podcaster.
     */
    static isPodcaster(user) {
        const member = sixGuild.member(user);

        if (member) {
            return member.roles.filter((role) => role.name === "Podcasters").size > 0;
        }

        return false;
    }

    //  #            ##
    //              #  #
    // ##     ###   #  #  #  #  ###    ##   ###
    //  #    ##     #  #  #  #  #  #  # ##  #  #
    //  #      ##   #  #  ####  #  #  ##    #
    // ###   ###     ##   ####  #  #   ##   #
    /**
     * Determines whether the user is the owner.
     * @param {DiscordJs.GuildMember} user The user to check.
     * @returns {boolean} Whether the user is a podcaster.
     */
    static isOwner(user) {
        return user && user.user.username === settings.admin.username && user.user.discriminator === settings.admin.discriminator;
    }

    //       #                 #      ##    #
    //       #                 #     #  #   #
    //  ##   ###    ##    ##   # #    #    ###   ###    ##    ###  # #    ###
    // #     #  #  # ##  #     ##      #    #    #  #  # ##  #  #  ####  ##
    // #     #  #  ##    #     # #   #  #   #    #     ##    # ##  #  #    ##
    //  ##   #  #   ##    ##   #  #   ##     ##  #      ##    # #  #  #  ###
    /**
     * Checks what streams are live.
     * @returns {void}
     */
    static checkStreams() {
        // Remove users who left the server.
        Db.getStreamers().then((streamerList) => {
            if (streamerList) {
                streamerList.forEach((streamer) => {
                    const {discord: id, streamer: name} = streamer;

                    if (!Discord.findGuildUserById(id)) {
                        Db.deleteStreamerByDiscord(id).then(() => {
                            Discord.removeStreamer(name);
                        }).catch((err) => {
                            Log.exception(`Database error removing streamer \`${name}\` \`${id}\`.`, err);
                        });
                    }
                });
            }

            Twitch.getStreams(["sixgaminggg"].concat(streamers, hosts)).then((streams) => {
                const wentOffline = [],
                    wentLive = [];
                let live = [];

                // Get the list of live channels.
                try {
                    live = streams.map((stream) => stream.channel.name.toLowerCase());
                } catch (err) {
                    Log.exception("Error checking streams.", err);
                    setTimeout(() => Discord.checkStreams(), 60000);
                    return;
                }

                // Being empty once is usually a sign of an error.  Will try again next time.
                if (live.length === 0) {
                    if (!wasEmptyLast) {
                        Log.log("Live list was empty.");
                        wasEmptyLast = true;
                        setTimeout(Discord.checkStreams, 60000);
                        return;
                    }
                } else {
                    wasEmptyLast = false;
                }

                // Detect which streams have gone offline.
                for (const key in liveChannels) {
                    if (live.indexOf(key) === -1) {
                        wentOffline.push(key);
                    }
                }

                // Remove live channel data from offline streams.
                for (const name of wentOffline) {
                    if (name.toLowerCase() === "sixgaminggg") {
                        discord.user.setStatus("online").catch((err) => {
                            if (err.code === "ECONNRESET") {
                                Log.warning("Connection reset while setting status to online.");
                            } else {
                                Log.exception("Error setting status to online.", err);
                            }
                        });
                        discord.user.setActivity(null, {}).catch((err) => {
                            if (err.code === "ECONNRESET") {
                                Log.warning("Connection reset while removing activity.");
                            } else {
                                Log.exception("Error removing activity.", err);
                            }
                        });
                    }
                    delete liveChannels[name];
                }

                // Detect which streams have gone online.
                live.forEach((name) => {
                    if (!liveChannels[name] && wentLive.indexOf(name) === -1) {
                        wentLive.push(name);
                    }
                });

                // Save channel data.
                streams.forEach((stream) => {
                    liveChannels[stream.channel.name.toLowerCase()] = stream;
                });

                // Discord notifications for new live channels.
                wentLive.forEach((stream) => {
                    Discord.announceStream(liveChannels[stream]);
                });

                // If manual hosting is active, check it.  Afterwards, update hosting.
                if (manualHosting) {
                    Twitch.getChannelStream(currentHost).then((results) => {
                        manualHosting = results && results.stream;

                        if (manualHosting) {
                            ({stream: liveChannels[currentHost]} = results);
                        } else {
                            delete liveChannels[currentHost];
                            currentHost = "";
                        }

                        Discord.updateHosting(live);
                    }).catch((err) => {
                        // Skip the current round of checking the manual host, and just check again next time.
                        Discord.updateHosting(live);
                        Log.exception(`Error checking current host ${currentHost}.`, err);
                    });
                } else {
                    Discord.updateHosting(live);
                }
            }).catch(() => {
                // This is commonly not an error, just try again in a minute.
                setTimeout(Discord.checkStreams, 60000);
            });
        }).catch((err) => {
            Log.exception("Database error getting streamers.", err);
            setTimeout(() => Discord.checkStreams(), 60000);
        });
    }

    //                #         #          #  #                #     #
    //                #         #          #  #                #
    // #  #  ###    ###   ###  ###    ##   ####   ##    ###   ###   ##    ###    ###
    // #  #  #  #  #  #  #  #   #    # ##  #  #  #  #  ##      #     #    #  #  #  #
    // #  #  #  #  #  #  # ##   #    ##    #  #  #  #    ##    #     #    #  #   ##
    //  ###  ###    ###   # #    ##   ##   #  #   ##   ###      ##  ###   #  #  #
    //       #                                                                   ###
    /**
     * Updates which channel is being hosted.
     * @param {string[]} live An array of live channels.
     * @returns {void}
     */
    static updateHosting(live) {
        let liveStreamers;

        if (Discord.isSixGamingLive()) {
            // Six Gaming is live, no need to update hosting.
            setTimeout(Discord.checkStreams, 60000);
            return;
        }

        if (manualHosting && currentHost && liveChannels[currentHost]) {
            // Manual hosting is in effect, no need to update hosting.
            setTimeout(Discord.checkStreams, 60000);
            return;
        }

        if (hostingTimestamps.length > 2 && hostingTimestamps[0] + 1805000 > new Date().getTime()) {
            // Hosted 3 times in under 30 minutes, cannot update hosting.
            setTimeout(Discord.checkStreams, 60000);
            return;
        }

        if (currentHost && !liveChannels[currentHost]) {
            lastHost = 0;
        }

        if (lastHost + 600000 > new Date().getTime()) {
            // Last host happened within 10 minutes, don't switch yet.
            setTimeout(Discord.checkStreams, 60000);
            return;
        }

        // Get lowercase list of live streamers.
        live = live.map((streamer) => streamer.toLowerCase());

        // Try to host a live streamer.
        liveStreamers = streamers.filter((streamer) => live.indexOf(streamer.toLowerCase()) !== -1);
        if (liveStreamers.length > 0) {
            if (liveStreamers[0] !== currentHost) {
                const host = liveStreamers[0].toLowerCase();

                Tmi.host("sixgaminggg", host).then(() => {
                    currentHost = host;

                    Tmi.queue(`Now hosting Six Gamer ${currentHost}.  Check out their stream at http://twitch.tv/${currentHost}!`);
                }).catch((err) => {
                    if (["bad_host_hosting", "bad_host_error"].indexOf(err) === -1) {
                        Log.exception("Problem hosting channel.", err);
                    }
                });
                lastHost = new Date().getTime();
                hostingTimestamps.push(new Date().getTime());
                while (hostingTimestamps.length > 3) {
                    hostingTimestamps.splice(0, 1);
                }
                streamers.splice(streamers.indexOf(currentHost), 1);
                Discord.addHost(currentHost);
            }
            setTimeout(Discord.checkStreams, 60000);
            return;
        }

        if (lastHost + 3600000 > new Date().getTime()) {
            // Last host happened within an hour, don't switch yet.
            setTimeout(Discord.checkStreams, 60000);
            return;
        }

        // Try to host a live host.
        liveStreamers = hosts.filter((host) => live.indexOf(host.toLowerCase()) !== -1);
        if (liveStreamers.length > 0) {
            if (liveStreamers[0].toLowerCase() !== currentHost) {
                const host = liveStreamers[0].toLowerCase();

                Tmi.host("sixgaminggg", host).then(() => {
                    currentHost = host;

                    Tmi.queue(`Now hosting ${currentHost}.  Check out their stream at http://twitch.tv/${currentHost}!`);
                }).catch((err) => {
                    if (["bad_host_hosting", "bad_host_error"].indexOf(err) === -1) {
                        Log.exception("Problem hosting channel.", err);
                    }
                });
                lastHost = new Date().getTime();
                hostingTimestamps.push(new Date().getTime());
                while (hostingTimestamps.length > 3) {
                    hostingTimestamps.splice(0, 1);
                }
                hosts.splice(hosts.indexOf(currentHost), 1);
                Discord.addHost(currentHost);
            }
            setTimeout(Discord.checkStreams, 60000);
            return;
        }

        setTimeout(Discord.checkStreams, 60000);
    }

    //                                                  ##    #
    //                                                 #  #   #
    //  ###  ###   ###    ##   #  #  ###    ##    ##    #    ###   ###    ##    ###  # #
    // #  #  #  #  #  #  #  #  #  #  #  #  #     # ##    #    #    #  #  # ##  #  #  ####
    // # ##  #  #  #  #  #  #  #  #  #  #  #     ##    #  #   #    #     ##    # ##  #  #
    //  # #  #  #  #  #   ##    ###  #  #   ##    ##    ##     ##  #      ##    # #  #  #
    /**
     * Announces a live stream.
     * @param {object} stream The stream.
     * @returns {void}
     */
    static announceStream(stream) {
        const message = new DiscordJs.RichEmbed({
            timestamp: new Date(),
            color: 0x16F6F8,
            footer: {icon_url: Discord.icon}, // eslint-disable-line camelcase
            thumbnail: {
                url: stream.channel.logo,
                width: 300,
                height: 300
            },
            image: {
                url: stream.channel.profile_banner,
                width: 1920,
                height: 480
            },
            url: stream.channel.url,
            fields: []
        });

        message.addField("Stream Title", stream.channel.status);

        if (stream.game) {
            message.addField("Now Playing", stream.game);
        }

        if (stream.channel.display_name.toLowerCase() === "sixgaminggg") {
            message.setDescription(`${streamNotifyRole} - Six Gaming just went live on Twitch!  Watch at ${stream.channel.url}`);
            currentHost = "";
            manualHosting = false;
            Tmi.unhost("sixgaminggg").catch(() => {});
            Tmi.queue("What's going on everyone?  Six Gaming is live!");
            discord.user.setStatus("online").catch((err) => {
                if (err.code === "ECONNRESET") {
                    Log.warning("Connection reset while setting status to online.");
                } else {
                    Log.exception("Error setting status to online.", err);
                }
            });
            discord.user.setActivity(stream.channel.status, {url: "http://twitch.tv/SixGamingGG", type: "STREAMING"}).catch((err) => {
                if (err.code === "ECONNRESET") {
                    Log.warning("Connection reset while setting activity.");
                } else {
                    Log.exception("Error setting activity.", err);
                }
            });
        } else if (streamers.indexOf(stream.channel.display_name.toLowerCase()) !== -1) {
            message.setDescription(`${streamNotifyRole} - Six Gamer ${stream.channel.display_name} just went live on Twitch!  Watch at ${stream.channel.url}`);
        } else if (hosts.indexOf(stream.channel.display_name.toLowerCase()) !== -1) { // eslint-disable-line no-negated-condition
            message.setDescription(`${stream.channel.display_name} just went live on Twitch!  Watch at ${stream.channel.url}`);
        } else {
            message.setDescription(`${stream.channel.display_name} has been hosted by Six Gaming on Twitch!  Watch at ${stream.channel.url}`);
            lastHost = 0;
            hostingTimestamps.push(new Date().getTime());
            while (hostingTimestamps.length > 3) {
                hostingTimestamps.splice(0, 1);
            }
        }

        Discord.richQueue(message, liveStreamAnnouncementsChannel);
    }

    //                   #     ####               #          #  #         #                 ##   #                             ##
    //                   #     #                  #          #  #                          #  #  #                              #
    // # #    ###  ###   # #   ###   # #   ###   ###   #  #  #  #   ##   ##     ##    ##   #     ###    ###  ###   ###    ##    #
    // ####  #  #  #  #  ##    #     ####  #  #   #    #  #  #  #  #  #   #    #     # ##  #     #  #  #  #  #  #  #  #  # ##   #
    // #  #  # ##  #     # #   #     #  #  #  #   #     # #   ##   #  #   #    #     ##    #  #  #  #  # ##  #  #  #  #  ##     #
    // #  #   # #  #     #  #  ####  #  #  ###     ##    #    ##    ##   ###    ##    ##    ##   #  #   # #  #  #  #  #   ##   ###
    //                                     #            #
    /**
     * Marks a voice channel as empty, queuing it for deleting in 5 minutes.
     * @param {DiscordJs.VoiceChannel} channel The voice channel that is now empty.
     * @returns {void}
     */
    static markEmptyVoiceChannel(channel) {
        channelDeletionTimeouts[channel.id] = setTimeout(async () => {
            try {
                await channel.delete();
            } catch (err) {
                Log.exception(`Couldn't delete empty voice channel ${channel}.`, err);
            }
            delete channelDeletionTimeouts[channel.id];
        }, 300000);
    }

    //                     #    ###    #                                #   ##   #                             ##
    //                     #    #  #                                    #  #  #  #                              #
    //  ###    ##   ###   ###   #  #  ##     ###    ##    ##   ###    ###  #     ###    ###  ###   ###    ##    #     ###
    // ##     #  #  #  #   #    #  #   #    ##     #     #  #  #  #  #  #  #     #  #  #  #  #  #  #  #  # ##   #    ##
    //   ##   #  #  #      #    #  #   #      ##   #     #  #  #     #  #  #  #  #  #  # ##  #  #  #  #  ##     #      ##
    // ###     ##   #       ##  ###   ###   ###     ##    ##   #      ###   ##   #  #   # #  #  #  #  #   ##   ###   ###
    /**
     * Sorts Discord channels.
     * @returns {Promise} A promise that resolves when the Discord channels are sorted.
     */
    static async sortDiscordChannels() {
        const channels = Array.from(sixGuild.channels.filter((channel) => channel.name.startsWith("twitch-")).values()).sort((a, b) => a.name.localeCompare(b.name)),
            positionChannel = async (index) => {
                const channel = sixGuild.channels.get(channels[index].id);

                index++;
                try {
                    await channel.edit({position: index});
                } catch (err) {
                    Log.exception("Problem repositioning channels.", err);
                    return;
                }

                if (index < channels.length) {
                    positionChannel(index);
                }
            };

        await positionChannel(0);
    }

    //              #    #  #                     #  #         #                 ##   #                             ##
    //              #    #  #                     #  #                          #  #  #                              #
    //  ###   ##   ###   #  #   ###    ##   ###   #  #   ##   ##     ##    ##   #     ###    ###  ###   ###    ##    #
    // #  #  # ##   #    #  #  ##     # ##  #  #  #  #  #  #   #    #     # ##  #     #  #  #  #  #  #  #  #  # ##   #
    //  ##   ##     #    #  #    ##   ##    #      ##   #  #   #    #     ##    #  #  #  #  # ##  #  #  #  #  ##     #
    // #      ##     ##   ##   ###     ##   #      ##    ##   ###    ##    ##    ##   #  #   # #  #  #  #  #   ##   ###
    //  ###
    /**
     * Get the voice channel the user is in.
     * @param {DiscordJs.GuildMember} user The user to check.
     * @returns {DiscordJs.VoiceChannel} The voice channel the user is in.
     */
    static getUserVoiceChannel(user) {
        return sixGuild.member(user).voiceChannel;
    }

    //   #    #             #   ##          #    ##       #  #  #                     ###         ###      #
    //  # #                 #  #  #               #       #  #  #                     #  #         #       #
    //  #    ##    ###    ###  #     #  #  ##     #     ###  #  #   ###    ##   ###   ###   #  #   #     ###
    // ###    #    #  #  #  #  # ##  #  #   #     #    #  #  #  #  ##     # ##  #  #  #  #  #  #   #    #  #
    //  #     #    #  #  #  #  #  #  #  #   #     #    #  #  #  #    ##   ##    #     #  #   # #   #    #  #
    //  #    ###   #  #   ###   ###   ###  ###   ###    ###   ##   ###     ##   #     ###     #   ###    ###
    //                                                                                       #
    /**
     * Returns the Discord user in the guild by their Discord ID.
     * @param {string} id The ID of the Discord user.
     * @returns {DiscordJs.GuildMember} The Discord user.
     */
    static findGuildUserById(id) {
        return sixGuild.members.find((m) => m.id === id);
    }

    //   #    #             #   ##   #                             ##    ###         #  #
    //  # #                 #  #  #  #                              #    #  #        ## #
    //  #    ##    ###    ###  #     ###    ###  ###   ###    ##    #    ###   #  #  ## #   ###  # #    ##
    // ###    #    #  #  #  #  #     #  #  #  #  #  #  #  #  # ##   #    #  #  #  #  # ##  #  #  ####  # ##
    //  #     #    #  #  #  #  #  #  #  #  # ##  #  #  #  #  ##     #    #  #   # #  # ##  # ##  #  #  ##
    //  #    ###   #  #   ###   ##   #  #   # #  #  #  #  #   ##   ###   ###     #   #  #   # #  #  #   ##
    //                                                                          #
    /**
     * Finds a Discord channel by its name.
     * @param {string} name The name of the channel.
     * @returns {DiscordJs.Channel} The Discord channel.
     */
    static findChannelByName(name) {
        return sixGuild.channels.find((c) => c.name === name);
    }

    //   #    #             #  ###         ##          ###         #  #
    //  # #                 #  #  #         #          #  #        ## #
    //  #    ##    ###    ###  #  #   ##    #     ##   ###   #  #  ## #   ###  # #    ##
    // ###    #    #  #  #  #  ###   #  #   #    # ##  #  #  #  #  # ##  #  #  ####  # ##
    //  #     #    #  #  #  #  # #   #  #   #    ##    #  #   # #  # ##  # ##  #  #  ##
    //  #    ###   #  #   ###  #  #   ##   ###    ##   ###     #   #  #   # #  #  #   ##
    //                                                        #
    /**
     * Finds a Discord role by its name.
     * @param {string} name The name of the role.
     * @returns {DiscordJs.Role} The Discord Role.
     */
    static findRoleByName(name) {
        return sixGuild.roles.find((r) => r.name === name);
    }

    //          #     #   ##    #
    //          #     #  #  #   #
    //  ###   ###   ###   #    ###   ###    ##    ###  # #    ##   ###
    // #  #  #  #  #  #    #    #    #  #  # ##  #  #  ####  # ##  #  #
    // # ##  #  #  #  #  #  #   #    #     ##    # ##  #  #  ##    #
    //  # #   ###   ###   ##     ##  #      ##    # #  #  #   ##   #
    /**
     * Adds a streamer to the auto hosting rotation.
     * @param {string} name The name of the streamer.
     * @returns {void}
     */
    static addStreamer(name) {
        streamers.push(name.toLocaleLowerCase());
    }

    //                                      ##    #
    //                                     #  #   #
    // ###    ##   # #    ##   # #    ##    #    ###   ###    ##    ###  # #    ##   ###
    // #  #  # ##  ####  #  #  # #   # ##    #    #    #  #  # ##  #  #  ####  # ##  #  #
    // #     ##    #  #  #  #  # #   ##    #  #   #    #     ##    # ##  #  #  ##    #
    // #      ##   #  #   ##    #     ##    ##     ##  #      ##    # #  #  #   ##   #
    /**
     * Removes a streamer from the auto hosting rotation.
     * @param {string} name The name of the streamer.
     * @returns {void}
     */
    static removeStreamer(name) {
        const streamerIndex = streamers.indexOf(name);

        if (streamerIndex !== -1) {
            streamers.splice(streamerIndex, 1);
        }
    }

    //          #     #  #  #                #
    //          #     #  #  #                #
    //  ###   ###   ###  ####   ##    ###   ###
    // #  #  #  #  #  #  #  #  #  #  ##      #
    // # ##  #  #  #  #  #  #  #  #    ##    #
    //  # #   ###   ###  #  #   ##   ###      ##
    /**
     * Adds a hosted streamer to the auto hosting rotation.
     * @param {string} name The name of the hosted streamer.
     * @returns {void}
     */
    static addHost(name) {
        hosts.push(name.toLocaleLowerCase());
    }

    //                                     #  #                #
    //                                     #  #                #
    // ###    ##   # #    ##   # #    ##   ####   ##    ###   ###
    // #  #  # ##  ####  #  #  # #   # ##  #  #  #  #  ##      #
    // #     ##    #  #  #  #  # #   ##    #  #  #  #    ##    #
    // #      ##   #  #   ##    #     ##   #  #   ##   ###      ##
    /**
     * Removes a streamer from the auto hosting rotation.
     * @param {string} name The name of the hosted streamer.
     * @returns {void}
     */
    static removeHost(name) {
        const hostIndex = hosts.indexOf(name);

        if (hostIndex !== -1) {
            hosts.splice(hostIndex, 1);
        }
    }

    //          #     #   ##    #                                               ###         ##
    //          #     #  #  #   #                                               #  #         #
    //  ###   ###   ###   #    ###   ###    ##    ###  # #    ##   ###    ###   #  #   ##    #     ##
    // #  #  #  #  #  #    #    #    #  #  # ##  #  #  ####  # ##  #  #  ##     ###   #  #   #    # ##
    // # ##  #  #  #  #  #  #   #    #     ##    # ##  #  #  ##    #       ##   # #   #  #   #    ##
    //  # #   ###   ###   ##     ##  #      ##    # #  #  #   ##   #     ###    #  #   ##   ###    ##
    /**
     * Adds a user to the streamres role.
     * @param {DiscordJs.GuildMember} user The user to add to the role.
     * @returns {Promise} A promise that resolves when the user has been added to the role.
     */
    static async addStreamersRole(user) {
        await sixGuild.member(user).addRole(streamersRole);
    }

    //                                      ##    #                                               ###         ##
    //                                     #  #   #                                               #  #         #
    // ###    ##   # #    ##   # #    ##    #    ###   ###    ##    ###  # #    ##   ###    ###   #  #   ##    #     ##
    // #  #  # ##  ####  #  #  # #   # ##    #    #    #  #  # ##  #  #  ####  # ##  #  #  ##     ###   #  #   #    # ##
    // #     ##    #  #  #  #  # #   ##    #  #   #    #     ##    # ##  #  #  ##    #       ##   # #   #  #   #    ##
    // #      ##   #  #   ##    #     ##    ##     ##  #      ##    # #  #  #   ##   #     ###    #  #   ##   ###    ##
    /**
     * Removes a user from the streamers role.
     * @param {DiscordJs.GuildMember} user The user to remove from the role.
     * @returns {Promise} A promise that resovles when the user has been removed from the role.
     */
    static async removeStreamersRole(user) {
        await sixGuild.member(user).removeRole(streamersRole);
    }

    //          #     #   ##    #                            #  #         #     #      #         ###         ##
    //          #     #  #  #   #                            ## #         #           # #        #  #         #
    //  ###   ###   ###   #    ###   ###    ##    ###  # #   ## #   ##   ###   ##     #    #  #  #  #   ##    #     ##
    // #  #  #  #  #  #    #    #    #  #  # ##  #  #  ####  # ##  #  #   #     #    ###   #  #  ###   #  #   #    # ##
    // # ##  #  #  #  #  #  #   #    #     ##    # ##  #  #  # ##  #  #   #     #     #     # #  # #   #  #   #    ##
    //  # #   ###   ###   ##     ##  #      ##    # #  #  #  #  #   ##     ##  ###    #      #   #  #   ##   ###    ##
    //                                                                                      #
    /**
     * Adds a user to the stream notify role.
     * @param {DiscordJs.GuildMember} user The user to add to the role.
     * @returns {Promise} A promise that resolves when the user has been added to the role.
     */
    static async addStreamNotifyRole(user) {
        await sixGuild.member(user).addRole(streamNotifyRole);
    }

    //                                      ##    #                            #  #         #     #      #         ###         ##
    //                                     #  #   #                            ## #         #           # #        #  #         #
    // ###    ##   # #    ##   # #    ##    #    ###   ###    ##    ###  # #   ## #   ##   ###   ##     #    #  #  #  #   ##    #     ##
    // #  #  # ##  ####  #  #  # #   # ##    #    #    #  #  # ##  #  #  ####  # ##  #  #   #     #    ###   #  #  ###   #  #   #    # ##
    // #     ##    #  #  #  #  # #   ##    #  #   #    #     ##    # ##  #  #  # ##  #  #   #     #     #     # #  # #   #  #   #    ##
    // #      ##   #  #   ##    #     ##    ##     ##  #      ##    # #  #  #  #  #   ##     ##  ###    #      #   #  #   ##   ###    ##
    //                                                                                                        #
    /**
     * Removes a user from the stream notify role.
     * @param {DiscordJs.GuildMember} user The user to remove from the role.
     * @returns {Promise} A promise that resolves when the user has been removed from the role.
     */
    static async removeStreamNotifyRole(user) {
        await sixGuild.member(user).removeRole(streamNotifyRole);
    }

    //                          #          ###         ##
    //                          #          #  #         #
    //  ##   ###    ##    ###  ###    ##   #  #   ##    #     ##
    // #     #  #  # ##  #  #   #    # ##  ###   #  #   #    # ##
    // #     #     ##    # ##   #    ##    # #   #  #   #    ##
    //  ##   #      ##    # #    ##   ##   #  #   ##   ###    ##
    /**
     * Creates a role.
     * @param {object} data The role data.
     * @returns {Promise} A promise that resolves when the role has been created.
     */
    static createRole(data) {
        return sixGuild.createRole(data);
    }

    //          #     #  #  #                     ###         ###         ##
    //          #     #  #  #                      #          #  #         #
    //  ###   ###   ###  #  #   ###    ##   ###    #     ##   #  #   ##    #     ##
    // #  #  #  #  #  #  #  #  ##     # ##  #  #   #    #  #  ###   #  #   #    # ##
    // # ##  #  #  #  #  #  #    ##   ##    #      #    #  #  # #   #  #   #    ##
    //  # #   ###   ###   ##   ###     ##   #      #     ##   #  #   ##   ###    ##
    /**
     * Adds a user to a role.
     * @param {DiscordJs.GuildMember} user The user to add to the role.
     * @param {DiscordJs.Role} role The role to add the user to.
     * @returns {Promise} A promise that resolves when the user has been added to the role.
     */
    static async addUserToRole(user, role) {
        await sixGuild.member(user).addRole(role);
    }

    //                                     #  #                     ####                    ###         ##
    //                                     #  #                     #                       #  #         #
    // ###    ##   # #    ##   # #    ##   #  #   ###    ##   ###   ###   ###    ##   # #   #  #   ##    #     ##
    // #  #  # ##  ####  #  #  # #   # ##  #  #  ##     # ##  #  #  #     #  #  #  #  ####  ###   #  #   #    # ##
    // #     ##    #  #  #  #  # #   ##    #  #    ##   ##    #     #     #     #  #  #  #  # #   #  #   #    ##
    // #      ##   #  #   ##    #     ##    ##   ###     ##   #     #     #      ##   #  #  #  #   ##   ###    ##
    /**
     * Removes a user from a role.
     * @param {DiscordJs.GuildMember} user The user to remove from the role.
     * @param {DiscordJs.Role} role The role to remove the user to.
     * @returns {Promise} A promise that resolves when the user has been removed from the role.
     */
    static async removeUserFromRole(user, role) {
        await sixGuild.member(user).removeRole(role);
    }

    //                          #          ###                #     ##   #                             ##
    //                          #           #                 #    #  #  #                              #
    //  ##   ###    ##    ###  ###    ##    #     ##   #  #  ###   #     ###    ###  ###   ###    ##    #
    // #     #  #  # ##  #  #   #    # ##   #    # ##   ##    #    #     #  #  #  #  #  #  #  #  # ##   #
    // #     #     ##    # ##   #    ##     #    ##     ##    #    #  #  #  #  # ##  #  #  #  #  ##     #
    //  ##   #      ##    # #    ##   ##    #     ##   #  #    ##   ##   #  #   # #  #  #  #  #   ##   ###
    /**
     * Creates a text channel.
     * @param {string} name The name of the channel to create.
     * @returns {Promise<DiscordJs.TextChannel>} A promise that resolves with the created channel.
     */
    static async createTextChannel(name) {
        const channel = /** @type {DiscordJs.TextChannel} */ (await sixGuild.createChannel(name, "text")); // eslint-disable-line no-extra-parens

        await channel.setParent(streamersCategory);

        return channel;
    }

    //                          #          #  #         #                 ##   #                             ##
    //                          #          #  #                          #  #  #                              #
    //  ##   ###    ##    ###  ###    ##   #  #   ##   ##     ##    ##   #     ###    ###  ###   ###    ##    #
    // #     #  #  # ##  #  #   #    # ##  #  #  #  #   #    #     # ##  #     #  #  #  #  #  #  #  #  # ##   #
    // #     #     ##    # ##   #    ##     ##   #  #   #    #     ##    #  #  #  #  # ##  #  #  #  #  ##     #
    //  ##   #      ##    # #    ##   ##    ##    ##   ###    ##    ##    ##   #  #   # #  #  #  #  #   ##   ###
    /**
     * Creates a voice channel.
     * @param {string} name The name of the channel to create.
     * @returns {Promise<DiscordJs.VoiceChannel>} A promise that resolves with the created channel.
     */
    static async createVoiceChannel(name) {
        const channel = /** @type {DiscordJs.VoiceChannel} */ (await sixGuild.createChannel(name, "voice")); // eslint-disable-line no-extra-parens

        await channel.edit({bitrate: 64000});
        await channel.setParent(voiceCategory);

        return channel;
    }

    //  #            ##    #           ##                #                #      #
    //              #  #              #  #                                #
    // ##     ###    #    ##    #  #  #      ###  # #   ##    ###    ###  #     ##    # #    ##
    //  #    ##       #    #     ##   # ##  #  #  ####   #    #  #  #  #  #      #    # #   # ##
    //  #      ##   #  #   #     ##   #  #  # ##  #  #   #    #  #   ##   #      #    # #   ##
    // ###   ###     ##   ###   #  #   ###   # #  #  #  ###   #  #  #     ####  ###    #     ##
    //                                                               ###
    /**
     * Returns whether Six Gaming is live on Twitch.
     * @returns {boolean} Whether Six Gaming is live on Twitch.
     */
    static isSixGamingLive() {
        return !!liveChannels.sixgaminggg;
    }

    //                   #  #                #
    //                   #  #                #
    //  ##    ###  ###   ####   ##    ###   ###
    // #     #  #  #  #  #  #  #  #  ##      #
    // #     # ##  #  #  #  #  #  #    ##    #
    //  ##    # #  #  #  #  #   ##   ###      ##
    /**
     * Determins whether a new channel can be hosted due to the 3 channels in 30 minutes limit impsoed by Twitch.
     * @returns {boolean} Whether a new channel can be hosted.
     */
    static canHost() {
        return hostingTimestamps.length > 2 && hostingTimestamps[0] + 1805000 > new Date().getTime();
    }
}

module.exports = Discord;
