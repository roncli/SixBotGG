const DiscordJs = require("discord.js"),

    Commands = require("./commands"),
    Log = require("./log"),
    settings = require("./settings"),
    Tmi = require("./tmi"),
    Twitch = require("./twitch"),

    channelDeletionTimeouts = {},
    discord = new DiscordJs.client(settings.discord),
    hostingTimestamps = [],
    hosts = [],
    liveChannels = {},
    messageParse = /^!([^ ]+)(?: +(.+[^ ]))? *$/,
    streamers = [];

let currentHost = "",
    lastHost = 0,
    liveStreamAnnouncementsChannel,
    manualHosting = false,
    readied = false,
    sixBotGGChannel,
    sixGuild,
    streamNotifyRole,
    streamersRole,
    wasEmptyLast = false;

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
        Discord.commands = new Commands(Discord);

        discord.addListener("ready", () => {
            Log.log("Connected to Discord.");

            sixGuild = discord.guilds.find("name", "Six Gaming");

            liveStreamAnnouncementsChannel = sixGuild.channels.find("name", "live-stream-announcements");
            sixBotGGChannel = sixGuild.channels.find("name", "sixbotgg");

            streamersRole = sixGuild.roles.find("name", "Streamers");
            streamNotifyRole = sixGuild.roles.find("name", "Stream Notify");

            // Start deleting old Discord channels.
            sixGuild.channels.filter((channel) => channel.type === "voice").forEach((channel) => {
                if (channel.name !== "\u{1F4AC} General" && channel.members.size === 0) {
                    Discord.markEmptyVoiceChannel(channel);
                }
            });

            if (!readied) {
                readied = true;
                Discord.checkStreams();
            }
        });

        discord.on("disconnect", (ev) => {
            Log.log("Disconnected from Discord...");
            Log.log(ev);
        });

        discord.addListener("message", (message) => {
            if (message.guild && message.guild.name === "Six Gaming" && message.channel.name === "sixbotgg" && message.channel.type === "text") {
                Discord.message(message.author, message.content);
            }
        });

        discord.addListener("voiceStateUpdate", (oldMember, newMember) => {
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
    }

    //                                      #
    //                                      #
    //  ##    ##   ###   ###    ##    ##   ###
    // #     #  #  #  #  #  #  # ##  #      #
    // #     #  #  #  #  #  #  ##    #      #
    //  ##    ##   #  #  #  #   ##    ##     ##
    /**
     * Connects to Discord.
     * @returns {Promise} A promise that's resolved when connected to Discord.
     */
    static connect() {
        return new Promise((resolve, reject) => {
            Log.log("Connecting to Discord...");
            discord.login(settings.discord.token).then(() => {
                Log.log("Connected.");
                resolve();
            }).catch((err) => {
                Log.log("Error connecting to Discord, will automatically retry.");
                Log.log(err);
                reject(err);
            });
        });
    }

    // # #    ##    ###    ###    ###   ###   ##
    // ####  # ##  ##     ##     #  #  #  #  # ##
    // #  #  ##      ##     ##   # ##   ##   ##
    // #  #   ##   ###    ###     # #  #      ##
    //                                  ###
    /**
     * Parses a message.
     * @param {User} user The user who sent the message.
     * @param {string} text The text of the message.
     * @returns {void}
     */
    static message(user, text) {
        const matches = messageParse.exec(text);

        if (matches) {
            if (Object.getOwnPropertyNames(Commands.prototype).filter((p) => typeof Commands.prototype[p] === "function" && p !== "constructor").indexOf(matches[1]) !== -1) {
                Discord.commands[matches[1]](user, matches[2]).then((success) => {
                    if (success) {
                        Log.log(`${user}: ${text}`);
                    }
                }).catch((err) => {
                    if (err.innerError) {
                        Log.log(err.message, err);
                    } else {
                        Log.log(err);
                    }
                });
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
     * @param {Channel} [channel] The channel to send the message to.
     * @returns {Promise} A promise that resolves when the message is sent.
     */
    static queue(message, channel) {
        if (!channel) {
            channel = sixBotGGChannel;
        }

        channel.send(message);
    }

    //  #           ###            #                      #
    //              #  #           #                      #
    // ##     ###   #  #   ##    ###   ##    ###   ###   ###    ##   ###
    //  #    ##     ###   #  #  #  #  #     #  #  ##      #    # ##  #  #
    //  #      ##   #     #  #  #  #  #     # ##    ##    #    ##    #
    // ###   ###    #      ##    ###   ##    # #  ###      ##   ##   #
    /**
     * Determins whether the user is a podcaster.
     * @param {User} user The user to check.
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
     * @param {User} user The user to check.
     * @returns {boolean} Whether the user is a podcaster.
     */
    static isOwner(user) {
        return user && user.username === settings.admin.username && user.discriminator === settings.admin.discriminator;
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
        Twitch.getStreams(["sixgaminggg"].concat(streamers, hosts).join(",")).then((streams) => {
            const wentOffline = [],
                wentLive = [];
            let live = [];

            // Get the list of live channels.
            try {
                live = streams.map((stream) => stream.channel.name.toLowerCase());
            } catch (err) {
                Log.log("Error checking streams.");
                Log.log(err, streams);
                setTimeout(() => Discord.checkStreams(), 60000);
                return;
            }

            // Being empty once is usually a sign of an error.  Will try again next time.
            if (live.length === 0) {
                if (!wasEmptyLast) {
                    Log.log("Live list was empty.");
                    Log.log(streams);
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
            wentOffline.forEach((name) => {
                if (name.toLowerCase() === "sixgaminggg") {
                    discord.user.setStatus("online", null, null);
                }
                delete liveChannels[name];
            });

            // Detect which streams have gone online.
            live.forEach((name) => {
                if (!liveChannels[name]) {
                    wentLive.push(name);
                }
            });

            // Save channel data.
            streams.forEach((stream) => {
                liveChannels[stream.channel.name.toLowerCase()] = stream;
            });

            // Discord notifications for new live channels.
            wentLive.forEach((stream) => {
                Discord.announceStream(stream, liveChannels[stream].game, liveChannels[stream].channel.status);
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
                    Log.log("Error checking current host.");
                    Log.log(err);
                });
            } else {
                Discord.updateHosting(live);
            }
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
                currentHost = liveStreamers[0].toLowerCase();
                Tmi.queue(`Now hosting Six Gamer ${currentHost}.  Check out their stream at http://twitch.tv/${currentHost}!`);
                Tmi.host("sixgaminggg", currentHost).catch((err) => {
                    if (err !== "bad_host_hosting") {
                        Log.log("Problem hosting channel.");
                        Log.log(err);
                    }
                });
                lastHost = new Date().getTime();
                hostingTimestamps.push(new Date().getTime());
                while (hostingTimestamps.length > 3) {
                    hostingTimestamps.splice(0, 1);
                }
                streamers.splice(streamers.indexOf(currentHost), 1);
                streamers.push(currentHost);
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
            if (liveStreamers[0] !== currentHost) {
                currentHost = liveStreamers[0].toLowerCase();
                Tmi.queue(`Now hosting ${currentHost}.  Check out their stream at http://twitch.tv/${currentHost}!`);
                Tmi.host("sixgaminggg", currentHost).catch((err) => {
                    if (err !== "bad_host_hosting") {
                        Log.log("Problem hosting channel.");
                        Log.log(err);
                    }
                });
                lastHost = new Date().getTime();
                hostingTimestamps.push(new Date().getTime());
                while (hostingTimestamps.length > 3) {
                    hostingTimestamps.splice(0, 1);
                }
                hosts.splice(hosts.indexOf(currentHost), 1);
                hosts.push(currentHost);
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
     * @param {string} stream The name of the stream.
     * @param {string} game The game being played.
     * @param {string} status The title of the stream.
     * @returns {void}
     */
    static announceStream(stream, game, status) {
        if (stream.toLowerCase() === "sixgaminggg") {
            if (game) {
                Discord.queue(`${streamNotifyRole} - Six Gaming just went live on Twitch with "${game}": "${status}"  Watch at http://twitch.tv/${stream}`, liveStreamAnnouncementsChannel);
            } else {
                Discord.queue(`${streamNotifyRole} - Six Gaming just went live on Twitch: "${status}"  Watch at http://twitch.tv/${stream}`, liveStreamAnnouncementsChannel);
            }
            currentHost = "";
            manualHosting = false;
            Tmi.unhost("sixgaminggg");
            Tmi.queue("What's going on everyone?  Six Gaming is live!");
            discord.user.setStatus("online", status, "http://twitch.tv/SixGamingGG");
        } else if (streamers.indexOf(stream.toLowerCase()) !== -1) {
            if (game) {
                Discord.queue(`${streamNotifyRole} - Six Gamer ${stream} just went live on Twitch with "${game}": "${status}"  Watch at http://twitch.tv/${stream}`, liveStreamAnnouncementsChannel);
            } else {
                Discord.queue(`${streamNotifyRole} - Six Gamer ${stream} just went live on Twitch: "${status}"  Watch at http://twitch.tv/${stream}`, liveStreamAnnouncementsChannel);
            }
        } else if (hosts.indexOf(stream.toLowerCase()) !== -1) { // eslint-disable-line no-negated-condition
            if (game) {
                Discord.queue(`${stream} just went live on Twitch with "${game}": "${status}"  Watch at http://twitch.tv/${stream}`, liveStreamAnnouncementsChannel);
            } else {
                Discord.queue(`${stream} just went live on Twitch: "${status}"  Watch at http://twitch.tv/${stream}`, liveStreamAnnouncementsChannel);
            }
        } else {
            if (game) {
                Discord.queue(`${stream} has been hosted by Six Gaming on Twitch, with "${game}": "${status}"  Watch at http://twitch.tv/${stream}`, liveStreamAnnouncementsChannel);
            } else {
                Discord.queue(`${stream} has been hosted by Six Gaming on Twitch: "${status}"  Watch at http://twitch.tv/${stream}`, liveStreamAnnouncementsChannel);
            }

            lastHost = 0;
            hostingTimestamps.push(new Date().getTime());
            while (hostingTimestamps.length > 3) {
                hostingTimestamps.splice(0, 1);
            }
        }
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
     * @param {VoiceChannel} channel The voice channel that is now empty.
     * @returns {void}
     */
    static markEmptyVoiceChannel(channel) {
        channelDeletionTimeouts[channel.id] = setTimeout(() => {
            channel.delete();
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
     * @returns {void}
     */
    static sortDiscordChannels() {
        const channels = Array.from(sixGuild.channels.filter((channel) => channel.name.startsWith("twitch-")).values()).sort((a, b) => a.name.localeCompare(b.name)),
            positionChannel = (index) => {
                const channel = sixGuild.channels.get(channels[index].id);

                channel.setPosition(100 + index).then(() => {
                    index++;
                    if (index < channels.length) {
                        positionChannel(index);
                    }
                }).catch((err) => {
                    Log.log("Problem repositioning channels.");
                    Log.log(err);
                });
            };

        positionChannel(0);
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
     * @param {User} user The user to check.
     * @returns {VoiceChannel} The voice channel the user is in.
     */
    static getUserVoiceChannel(user) {
        return sixGuild.member(user).voiceChannel;
    }

    //   #    #             #  #  #                     ###         ###      #
    //  # #                 #  #  #                     #  #         #       #
    //  #    ##    ###    ###  #  #   ###    ##   ###   ###   #  #   #     ###
    // ###    #    #  #  #  #  #  #  ##     # ##  #  #  #  #  #  #   #    #  #
    //  #     #    #  #  #  #  #  #    ##   ##    #     #  #   # #   #    #  #
    //  #    ###   #  #   ###   ##   ###     ##   #     ###     #   ###    ###
    //                                                         #
    /**
     * Returns the Discord user by their Discord ID.
     * @param {string} id The ID of the Discord user.
     * @returns {User} The Discord user.
     */
    static findUserById(id) {
        return discord.users.findAll("id", id);
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
     * @returns {Channel} The Discord channel.
     */
    static findChannelByName(name) {
        return sixGuild.channels.find("name", name);
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
     * @returns {Role} The Discord Role.
     */
    static findRoleByName(name) {
        return sixGuild.roles.find("name", name);
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
        streamers.push(name);
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
        hosts.push(name);
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
     * @param {User} user The user to add to the role.
     * @returns {Promise} A promise that resolves when the user has been added to the role.
     */
    static addStreamersRole(user) {
        return sixGuild.member(user).addRole(streamersRole);
    }

    //                                      ##    #                                               ###         ##
    //                                     #  #   #                                               #  #         #
    // ###    ##   # #    ##   # #    ##    #    ###   ###    ##    ###  # #    ##   ###    ###   #  #   ##    #     ##
    // #  #  # ##  ####  #  #  # #   # ##    #    #    #  #  # ##  #  #  ####  # ##  #  #  ##     ###   #  #   #    # ##
    // #     ##    #  #  #  #  # #   ##    #  #   #    #     ##    # ##  #  #  ##    #       ##   # #   #  #   #    ##
    // #      ##   #  #   ##    #     ##    ##     ##  #      ##    # #  #  #   ##   #     ###    #  #   ##   ###    ##
    /**
     * Removes a user from the streamers role.
     * @param {User} user The user to remove from the role.
     * @returns {Promise} A promise that resovles when the user has been removed from the role.
     */
    static removeStreamersRole(user) {
        return sixGuild.member(user).removeRole(streamersRole);
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
     * @param {User} user The user to add to the role.
     * @returns {Promise} A promise that resolves when the user has been added to the role.
     */
    static addStreamNotifyRole(user) {
        return sixGuild.member(user).addRole(streamNotifyRole);
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
     * @param {User} user The user to remove from the role.
     * @returns {Promise} A promise that resolves when the user has been removed from the role.
     */
    static removeStreamNotifyRole(user) {
        return sixGuild.member(user).removeRole(streamNotifyRole);
    }

    //          #     #  #  #                     ###         ###         ##
    //          #     #  #  #                      #          #  #         #
    //  ###   ###   ###  #  #   ###    ##   ###    #     ##   #  #   ##    #     ##
    // #  #  #  #  #  #  #  #  ##     # ##  #  #   #    #  #  ###   #  #   #    # ##
    // # ##  #  #  #  #  #  #    ##   ##    #      #    #  #  # #   #  #   #    ##
    //  # #   ###   ###   ##   ###     ##   #      #     ##   #  #   ##   ###    ##
    /**
     * Adds a user to a role.
     * @param {User} user The user to add to the role.
     * @param {Role} role The role to add the user to.
     * @returns {Promise} A promise that resolves when the user has been added to the role.
     */
    static addUserToRole(user, role) {
        return sixGuild.member(user).addRole(role);
    }

    //                                     #  #                     ####                    ###         ##
    //                                     #  #                     #                       #  #         #
    // ###    ##   # #    ##   # #    ##   #  #   ###    ##   ###   ###   ###    ##   # #   #  #   ##    #     ##
    // #  #  # ##  ####  #  #  # #   # ##  #  #  ##     # ##  #  #  #     #  #  #  #  ####  ###   #  #   #    # ##
    // #     ##    #  #  #  #  # #   ##    #  #    ##   ##    #     #     #     #  #  #  #  # #   #  #   #    ##
    // #      ##   #  #   ##    #     ##    ##   ###     ##   #     #     #      ##   #  #  #  #   ##   ###    ##
    /**
     * Removes a user from a role.
     * @param {User} user The user to remove from the role.
     * @param {Role} role The role to remove the user to.
     * @returns {Promise} A promise that resolves when the user has been removed from the role.
     */
    static removeUserFromRole(user, role) {
        return sixGuild.member(user).removeRole(role);
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
     * @returns {Promise} A promise that resolves when the channel has been created.
     */
    static createTextChannel(name) {
        return sixGuild.createChannel(name, "text");
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
     * @returns {Promise} A promise that resolves when the channel has been created.
     */
    static createVoiceChannel(name) {
        return sixGuild.createChannel(name, "voice");
    }

    //                          #          ###         ##
    //                          #          #  #         #
    //  ##   ###    ##    ###  ###    ##   #  #   ##    #     ##
    // #     #  #  # ##  #  #   #    # ##  ###   #  #   #    # ##
    // #     #     ##    # ##   #    ##    # #   #  #   #    ##
    //  ##   #      ##    # #    ##   ##   #  #   ##   ###    ##
    /**
     * Creates a role.
     * @param {Role} role The name of the role to create.
     * @returns {Promise} A promise that resolves when the channel has been created.
     */
    static createRole(role) {
        return discord.createRole(role);
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
