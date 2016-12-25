var pjson = require("./package.json"),
    settings = require("./settings"),
    db = require("./database"),
    messageParse = /^!([^ ]+)(?: +(.+[^ ]))? *$/,
    codeParse = /^[1-9][0-9]{2}$/,
    userParse = /^([^#]+)#([1-9][0-9]+)$/,
    addGameParse = /^([a-zA-Z0-9]{2,50}) +(.{2,255})$/,
    nicks = {},
    streamers = [],
    hosts = [],
    hostingTimestamps = [],
    liveChannels = {},
    channelDeletionTimeouts = {},
    userCreatedChannels = {},
    autoCommandRotation = [
        "facebook",
        "twitter",
        "youtube",
        "itunes",
        "discord",
        "website"
    ],
    owHeroes = [
        "Genji",
        "McCree",
        "Pharah",
        "Reaper",
        "Soldier: 76",
        "Tracer",
        "Bastion",
        "Hanzo",
        "Junkrat",
        "Mei",
        "Torbj\xf6rn",
        "Widowmaker",
        "D.Va",
        "Reinhardt",
        "Roadhog",
        "Winston",
        "Zarya",
        "L\xfacio",
        "Mercy",
        "Symmetra",
        "Zenyatta",
        "Ana",
        "Sombra"
    ],
    lastHost = 0,
    wasEmptyLast = false,
    commandRotationWait = 5,
    commandRotationTimeout = 0,
    currentHost = "",
    manualHosting = false,
    tmi, discord, twitch, sixDiscord, sixBotGGChannel, liveStreamAnnouncementsChannel, streamersRole;

SixGaming = {};

SixGaming.start = function(_tmi, _discord, _twitch) {
    tmi = _tmi;
    discord = _discord;
    twitch = _twitch;

    var startup = function() {
        console.log("Starting up...");
        db.query("select streamer from streamer where validated = 1; select streamer from host", {}, function(err, data) {
            console.log("Got streamer data...");
            var readied = false,

                checkStreams = function() {
                    var channels = ["sixgaminggg"].concat(streamers, hosts).join(","),
                        streams = [],

                        getStreams = function(offset) {
                            twitch.getStreams({channel: channels, limit: 100, stream_type: "live", offset: offset}, function(err, results) {
                                var wentOffline = [], wentLive = [],
                                    live, key;

                                if (err || !results) {
                                    // Skip the current round of checking streams, and just check again in a minute.
                                    console.log("Error checking streams.");
                                    console.log(err, results);
                                    setTimeout(checkStreams, 60000);
                                    return;
                                }

                                // Sanitize data.
                                if (!results.streams) {
                                    results.streams = [];
                                }
                                if (!results._total) {
                                    results._total = 0;
                                }

                                // Concat streams and continue getting more streams if necessary.
                                streams = streams.concat(results.streams);
                                if (results._total > offset + 100) {
                                    getStreams(offset + 100);
                                    return;
                                }

                                // Get the list of live channels.
                                try {
                                    live = streams.map(function(stream) {
                                        return stream.channel.name.toLowerCase();
                                    });
                                } catch (err) {
                                    console.log("Error checking streams.");
                                    console.log(err, results);
                                    setTimeout(checkStreams, 60000);
                                    return;
                                }

                                // Being empty once is usually a sign of an error.  Will try again next time.
                                if (live.length === 0) {
                                    if (!wasEmptyLast) {
                                        console.log("Live list was empty.");
                                        console.log(err, results);
                                        wasEmptyLast = true;
                                        setTimeout(checkStreams, 60000);
                                        return;
                                    }
                                } else {
                                    wasEmptyLast = false;
                                }

                                // Detect which streams have gone offline.
                                for (key in liveChannels) {
                                    if (liveChannels.hasOwnProperty(key)) {
                                        if (live.indexOf(key) === -1) {
                                            wentOffline.push(key);
                                        }
                                    }
                                }

                                // Remove live channel data from offline streams.
                                wentOffline.forEach(function(name) {
                                    if (name.toLowerCase() === "sixgaminggg") {
                                        discord.user.setStatus("online", null, null);
                                    }
                                    delete liveChannels[name];
                                });

                                // Detect which streams have gone online.
                                live.forEach(function(name) {
                                    if (!liveChannels[name]) {
                                        wentLive.push(name);
                                    }
                                });

                                // Save channel data.
                                streams.forEach(function(stream) {
                                    liveChannels[stream.channel.name.toLowerCase()] = stream;
                                });

                                // Discord notifications for new live channels.
                                wentLive.forEach(function(stream) {
                                    if (stream.toLowerCase() === "sixgaminggg") {
                                        if (liveChannels[stream].game) {
                                            SixGaming.discordQueue("@everyone - Six Gaming just went live on Twitch with \"" + liveChannels[stream].game + "\": \"" + liveChannels[stream].channel.status + "\"  Watch at http://twitch.tv/" + stream, liveStreamAnnouncementsChannel);
                                        } else {
                                            SixGaming.discordQueue("@everyone - Six Gaming just went live on Twitch: \"" + liveChannels[stream].channel.status + "\"  Watch at http://twitch.tv/" + stream, liveStreamAnnouncementsChannel);
                                        }
                                        currentHost = "";
                                        manualHosting = false;
                                        tmi.unhost("sixgaminggg")
                                        SixGaming.tmiQueue("What's going on everyone?  Six Gaming is live!");
                                        discord.user.setStatus("online", liveChannels[stream].channel.status, "http://twitch.tv/SixGamingGG");
                                    } else if (streamers.indexOf(stream.toLowerCase()) !== -1) {
                                        if (liveChannels[stream].game) {
                                            SixGaming.discordQueue("@everyone - Six Gamer " + stream + " just went live on Twitch with \"" + liveChannels[stream].game + "\": \"" + liveChannels[stream].channel.status + "\"  Watch at http://twitch.tv/" + stream, liveStreamAnnouncementsChannel);
                                        } else {
                                            SixGaming.discordQueue("@everyone - Six Gamer " + stream + " just went live on Twitch: \"" + liveChannels[stream].channel.status + "\"  Watch at http://twitch.tv/" + stream, liveStreamAnnouncementsChannel);
                                        }
                                    } else if (hosts.indexOf(stream.toLowerCase()) !== -1) {
                                        if (liveChannels[stream].game) {
                                            SixGaming.discordQueue(stream + " just went live on Twitch with \"" + liveChannels[stream].game + "\": \"" + liveChannels[stream].channel.status + "\"  Watch at http://twitch.tv/" + stream, liveStreamAnnouncementsChannel);
                                        } else {
                                            SixGaming.discordQueue(stream + " just went live on Twitch: \"" + liveChannels[stream].channel.status + "\"  Watch at http://twitch.tv/" + stream, liveStreamAnnouncementsChannel);
                                        }
                                    }
                                });

                                // If manual hosting is active, check it.  Afterwards, update hosting.
                                if (manualHosting) {
                                    twitch.getChannelStream(currentHost, function(err, results) {
                                        if (err) {
                                            // Skip the current round of checking the manual host, and just check again next time.
                                            console.log("Error checking current host.");
                                            console.log(err);
                                            updateHosting(live);
                                            return;
                                        }

                                        manualHosting = results && results.stream;
                                        if (manualHosting) {
                                            liveChannels[currentHost] = results.stream;
                                        } else {
                                            delete liveChannels[currentHost];
                                            currentHost = "";
                                        }
                                        updateHosting(live);
                                    });
                                } else {
                                    updateHosting(live);
                                }
                            });
                        },

                        updateHosting = function(live) {
                            var liveStreamers;

                            if (liveChannels["sixgaminggg"]) {
                                // Six Gaming is live, no need to update hosting.
                                setTimeout(checkStreams, 60000);
                                return;
                            }

                            if (manualHosting && currentHost && liveChannels[currentHost]) {
                                // Manual hosting is in effect, no need to update hosting.
                                setTimeout(checkStreams, 60000);
                                return;
                            }

                            if (hostingTimestamps.length > 2 && hostingTimestamps[0] + 1805000 > new Date().getTime()) {
                                // Hosted 3 times in under 30 minutes, cannot update hosting.
                                setTimeout(checkStreams, 60000);
                                return;
                            }

                            if (currentHost && !liveChannels[currentHost]) {
                                lastHost = 0;
                            }

                            if (lastHost + 600000 > new Date().getTime()) {
                                // Last host happened within 10 minutes, don't switch yet.
                                setTimeout(checkStreams, 60000);
                                return;
                            }

                            // Get lowercase list of live streamers.
                            live = live.map(function(streamer) {
                                return streamer.toLowerCase();
                            });

                            // Try to host a live streamer.
                            liveStreamers = streamers.filter(function(streamer) {
                                return live.indexOf(streamer.toLowerCase()) !== -1;
                            });
                            if (liveStreamers.length > 0) {
                                if (liveStreamers[0] !== currentHost) {
                                    currentHost = liveStreamers[0].toLowerCase();
                                    SixGaming.tmiQueue("Now hosting Six Gamer " + currentHost + ".  Check out their stream at http://twitch.tv/" + currentHost + "!");
                                    tmi.host("sixgaminggg", currentHost).catch(function(err) {
                                        if (err !== "bad_host_hosting") {
                                            console.log("Problem hosting channel.");
                                            console.log(err);
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
                                setTimeout(checkStreams, 60000);
                                return;
                            }

                            if (lastHost + 3600000 > new Date().getTime()) {
                                // Last host happened within an hour, don't switch yet.
                                setTimeout(checkStreams, 60000);
                                return;
                            }

                            // Try to host a live host.
                            liveStreamers = hosts.filter(function(host) {
                                return live.indexOf(host.toLowerCase()) !== -1;
                            });
                            if (liveStreamers.length > 0) {
                                if (liveStreamers[0] !== currentHost) {
                                    currentHost = liveStreamers[0].toLowerCase();
                                    SixGaming.tmiQueue("Now hosting " + currentHost + ".  Check out their stream at http://twitch.tv/" + currentHost + "!");
                                    tmi.host("sixgaminggg", currentHost).catch(function(err) {
                                        if (err !== "bad_host_hosting") {
                                            console.log("Problem hosting channel.");
                                            console.log(err);
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
                                setTimeout(checkStreams, 60000);
                                return;
                            }

                            setTimeout(checkStreams, 60000);
                        };

                    getStreams(0);
                },

                tmiConnect = function() {
                    console.log("Connecting to IRC...");
                    tmi.connect().then(function() {
                        console.log("Connected.  Startup complete.");

                        tmi.raw("CAP REQ :twitch.tv/membership");
                    }).catch(function(err) {
                        console.log("Error connecting, will retry.");
                        console.log(err);
                    });
                },

                discordConnect = function() {
                    console.log("Connecting to Discord...");
                    discord.login(settings.discord.token).catch(function(err) {
                        if (err) {
                            console.log(err);
                            discord.destroy().then(discordConnect).catch(discordConnect);
                        }
                        console.log("Connected.");
                    });
                };

            if (err) {
                console.log(err);
                console.log("Error!  Trying again in 60 seconds...");
                setTimeout(startup, 60000);
                return;
            }

            streamers = data[0].map(function(streamer) {return streamer.streamer;});
            hosts = data[1].map(function(streamer) {return streamer.streamer;});

            tmi.on("disconnected", function(message) {
                console.log("DISCONNECTED", message);
                tmi.disconnect().then(function() {
                    tmiConnect();
                }).catch(function() {
                    tmiConnect();
                });
            });

            tmi.on("message", function(channel, userstate, text, self) {
                if (!self && channel === "#sixgaminggg") {
                    SixGaming.tmiMessage(userstate["display-name"], text);
                }
            });

            tmi.on("names", function(channel, users) {
                if (channel === "#sixgaminggg") {
                    users.forEach(function(user) {
                        SixGaming.join(user);
                    });
                }
            })

            tmi.on("join", function(channel, username, self) {
                if (!self && channel === "#sixgaminggg") {
                    SixGaming.join(username);
                }
            });

            tmi.on("part", function(channel, username, self) {
                if (!self && channel === "#sixgaminggg") {
                    SixGaming.part(username);
                }
            });

            tmi.on("mod", function(channel, username) {
                if (channel === "#sixgaminggg") {
                    SixGaming["+mode"](username, "o");
                }
            });

            discord.addListener("ready", function() {
                console.log("Discord ready.");
                sixDiscord = discord.guilds.find("name", "Six Gaming");
                sixBotGGChannel = sixDiscord.channels.find("name", "sixbotgg");
                liveStreamAnnouncementsChannel = sixDiscord.channels.find("name", "live-stream-announcements");
                streamersRole = sixDiscord.roles.find("name", "Streamers");

                if (!readied) {
                    readied = true;

                    // Connect to IRC.
                    tmiConnect();

                    // Setup IRC command rotation.
                    SixGaming.commandRotation();

                    // Check streams.
                    checkStreams();

                    // Start deleting old Discord channels.
                    sixDiscord.channels.filter(function(channel) {
                        return channel.type === "voice";
                    }).forEach(function(channel) {
                        if (channel.name !== "\u{1F4AC} General" && channel.members.size === 0) {
                            SixGaming.markEmptyVoiceChannel(channel);
                        }
                    });
                }
            });

            discord.addListener("message", function(message) {
                if (message.guild && message.guild.name === "Six Gaming" && message.channel.name === "sixbotgg" && message.channel.type === "text") {
                    SixGaming.discordMessage(message.author.username, message.author, message.content);
                }
            });

            discord.addListener("voiceStateUpdate", function(oldMember, newMember) {
                if (oldMember.voiceChannel) {
                    if (oldMember.voiceChannel.name !== "\u{1F4AC} General" && oldMember.voiceChannel.members.size === 0) {
                        SixGaming.markEmptyVoiceChannel(oldMember.voiceChannel);
                    }
                }

                if (newMember.voiceChannel) {
                    if (channelDeletionTimeouts[newMember.voiceChannel.id]) {
                        clearTimeout(channelDeletionTimeouts[newMember.voiceChannel.id]);
                        delete channelDeletionTimeouts[newMember.voiceChannel.id];
                    }
                }
            });

            // Connect to Discord.
            discordConnect();
        });
    };

    startup();
};

SixGaming.commandRotation = function() {
    if (commandRotationWait <= 0) {
        SixGaming.tmiMessages[autoCommandRotation[0]]("SixBotGG");
    }

    commandRotationTimeout = setTimeout(function() {
        SixGaming.commandRotation();
    }, 600000);
};

SixGaming.tmiQueue = function(message) {
    tmi.say("sixgaminggg", message);
};

SixGaming.discordQueue = function(message, channel) {
    if (!channel) {
        channel = sixBotGGChannel;
    }
    channel.sendMessage(message);
};

SixGaming.sortDiscordChannels = function() {
    var channels = Array.from(sixDiscord.channels.filter(function(channel) {
        return channel.name.startsWith("twitch-") || channel.name.startsWith("game-");
    }).values()).sort(function(a, b) {
        if (a.name.startsWith("twitch-") && b.name.startsWith("game-")) {
            return -1;
        }

        if (a.name.startsWith("game-") && b.name.startsWith("twitch-")) {
            return 1;
        }

        return a.name.localeCompare(b.name);
    }),
        index = 0,

        positionChannel = function() {
            var channel = sixDiscord.channels.find("id", channels[index].id);
            channel.setPosition(100 + index).then(function() {
                index++;
                if (index < channels.length) {
                    positionChannel();
                }
            }).catch(function(err) {
                console.log("Problem repositioning channels.");
                console.log(err);
            });;
        };

    positionChannel();
};

SixGaming.markEmptyVoiceChannel = function(channel) {
    channelDeletionTimeouts[channel.id] = setTimeout(function() {
        channel.delete();
        delete channelDeletionTimeouts[channel.id];
    }, 300000)
};

SixGaming.join = function(nick) {
    nicks[nick] = "";
};

SixGaming.part = function(nick) {
    delete(nicks[nick]);
};

SixGaming["+mode"] = function(nick, mode) {
    if (mode === "o" && nicks[nick] !== "o") {
        nicks[nick] = "o";
        if (nick !== "sixbotgg" && nick !== "sixgaminggg") {
            SixGaming.tmiQueue("Hi, " + nick + "! HeyGuys");
        }
    }
};

SixGaming.isAdmin = function(name) {
    return nicks[name] === "o";
};

SixGaming.isPodcaster = function(user) {
    var member = sixDiscord.member(user);
    if (member) {
        return member.roles.filter(function(role) {
            return role.name === "Podcasters";
        }).size > 0;
    }

    return false;
};

SixGaming.tmiMessage = function(from, text) {
    var matches = messageParse.exec(text);

    commandRotationWait--;

    if (matches) {
        if (SixGaming.tmiMessages[matches[1]]) {
            SixGaming.tmiMessages[matches[1]].call(this, from, matches[2]);
        }
    }
};

SixGaming.tmiMessages = {
    facebook: function(from, message) {
        if (!message) {
            var index = autoCommandRotation.indexOf("facebook");
            if (index !== -1) {
                commandRotationWait = 5;
                autoCommandRotation.splice(index, 1);
                autoCommandRotation.push("facebook");
            }
            SixGaming.tmiQueue("Check out Six Gaming on Facebook at http://fb.me/SixGamingGG");
            clearTimeout(commandRotationTimeout);
            commandRotationTimeout = setTimeout(function() {
                SixGaming.commandRotation();
            }, 600000);
        }
    },

    twitter: function(from, message) {
        if (!message) {
            var index = autoCommandRotation.indexOf("twitter");
            if (index !== -1) {
                commandRotationWait = 5;
                autoCommandRotation.splice(index, 1);
                autoCommandRotation.push("twitter");
            }
            SixGaming.tmiQueue("Follow Six Gaming on Twitter at http://twitter.com/SixGamingGG");
            clearTimeout(commandRotationTimeout);
            commandRotationTimeout = setTimeout(function() {
                SixGaming.commandRotation();
            }, 600000);
        }
    },

    youtube: function(from, message) {
        if (!message) {
            var index = autoCommandRotation.indexOf("youtube");
            if (index !== -1) {
                commandRotationWait = 5;
                autoCommandRotation.splice(index, 1);
                autoCommandRotation.push("youtube");
            }
            SixGaming.tmiQueue("Visit Six Gaming's YouTube page for a complete archive of our podcast at http://ronc.li/six-youtube");
            clearTimeout(commandRotationTimeout);
            commandRotationTimeout = setTimeout(function() {
                SixGaming.commandRotation();
            }, 600000);
        }
    },

    itunes: function(from, message) {
        if (!message) {
            var index = autoCommandRotation.indexOf("itunes");
            if (index !== -1) {
                commandRotationWait = 5;
                autoCommandRotation.splice(index, 1);
                autoCommandRotation.push("itunes");
            }
            SixGaming.tmiQueue("Subscribe to Six Gaming's video podcast on iTunes at http://ronc.li/six-itunes");
            clearTimeout(commandRotationTimeout);
            commandRotationTimeout = setTimeout(function() {
                SixGaming.commandRotation();
            }, 600000);
        }
    },

    discord: function(from, message) {
        if (!message) {
            var index = autoCommandRotation.indexOf("discord");
            if (index !== -1) {
                commandRotationWait = 5;
                autoCommandRotation.splice(index, 1);
                autoCommandRotation.push("discord");
            }
            SixGaming.tmiQueue("Join the Six Gaming Discord server for all the memes!  We are a community of gamers that enjoy playing together.  Join at http://ronc.li/six-discord!");
            clearTimeout(commandRotationTimeout);
            commandRotationTimeout = setTimeout(function() {
                SixGaming.commandRotation();
            }, 600000);
        }
    },

    website: function(from, message) {
        if (!message) {
            var index = autoCommandRotation.indexOf("website");
            if (index !== -1) {
                commandRotationWait = 5;
                autoCommandRotation.splice(index, 1);
                autoCommandRotation.push("website");
            }
            SixGaming.tmiQueue("We have a website?  Yes, we do!  Visit us at http://six.gg for everything Six Gaming!");
            clearTimeout(commandRotationTimeout);
            commandRotationTimeout = setTimeout(function() {
                SixGaming.commandRotation();
            }, 600000);
        }
    },

    version: function(from, message) {
        if (!message) {
            SixGaming.tmiQueue("SixBotGG by roncli, Version " + pjson.version);
        }
    },

    host: function(from, message) {
        if (message && SixGaming.isAdmin(from)) {
            if (liveChannels["SixGamingGG"]) {
                SixGaming.tmiQueue("Sorry, " + from + ", but Six Gaming is live right now!");
                return;
            }

            if (hostingTimestamps.length > 2 && hostingTimestamps[0] + 1805000 > new Date().getTime()) {
                SixGaming.tmiQueue("Sorry, " + from + ", but I can only host 3 times within 30 minutes.");
                return;
            }

            twitch.getChannelStream(message, function(err, results) {
                manualHosting = !err && results && results.stream;
                if (manualHosting) {
                    currentHost = message;
                    SixGaming.tmiQueue("Now hosting " + currentHost + ".  Check out their stream at http://twitch.tv/" + currentHost + "!");
                    tmi.host("sixgaminggg", currentHost).catch(function(err) {
                        if (err !== "bad_host_hosting") {
                            console.log("Problem hosting channel.");
                            console.log(err);
                        }
                    });
                    if (results.stream.game) {
                        SixGaming.discordQueue(message + " has been hosted by Six Gaming on Twitch, with \"" + results.stream.game + "\": \"" + results.stream.channel.status + "\"  Watch at http://twitch.tv/" + message, liveStreamAnnouncementsChannel);
                    } else {
                        SixGaming.discordQueue(message + " has been hosted by Six Gaming on Twitch: \"" + results.stream.channel.status + "\"  Watch at http://twitch.tv/" + message, liveStreamAnnouncementsChannel);
                    }

                    lastHost = 0;
                    hostingTimestamps.push(new Date().getTime());
                    while (hostingTimestamps.length > 3) {
                        hostingTimestamps.splice(0, 1);
                    }
                } else {
                    SixGaming.tmiQueue("Sorry, " + from + ", but " + message + " is not live right now.");
                }
            });
        }
    },

    unhost: function(from, message) {
        if (!message && SixGaming.isAdmin(from)) {
            tmi.unhost("sixgaminggg");
            manualHosting = false;
            currentHost = "";
        }
    },

    confirm: function(from, message) {
        if (message && codeParse.test(message)) {
            var code = +message;

            db.query(
                "select discord from streamer where streamer = @streamer and code = @code",
                {
                    streamer: {type: db.VARCHAR(50), value: from},
                    code: {type: db.INT, value: code}
                },
                function(err, data) {
                    var id, user, matches;

                    if (err) {
                        SixGaming.tmiQueue("Sorry, " + from + ", but the server is currently down.  Try later, or get a hold of roncli for fixing.");
                        return;
                    }

                    if (data[0].length === 0) {
                        return;
                    }

                    id = data[0][0].discord;

                    db.query(
                        "update streamer set code = 0, validated = 1 where streamer = @streamer;delete from host where streamer = @streamer",
                        {streamer: {type: db.VARCHAR(50), value: from}},
                        function(err, data) {
                            var users, user, hostIndex;

                            if (err) {
                                SixGaming.tmiQueue("Sorry, " + from + ", but the server is currently down.  Try later, or get a hold of roncli for fixing.");
                                return;
                            }

                            users = discord.users.findAll("id", id);
                            if (users.length !== 0) {
                                user = users[0];
                            }
                            sixDiscord.member(user).addRole(streamersRole);

                            sixDiscord.createChannel("twitch-" + from, "text").then(function(channel) {
                                channel.setTopic("This channel is for " + user + "'s Twitch stream.  Follow " + user + " on Twitch at http://twitch.tv/" + from + ".").then(function() {
                                    channel.setPosition(9999).then(SixGaming.sortDiscordChannels).catch(function(err) {
                                        console.log("Problem setting position.");
                                        console.log(err);
                                    });
                                });

                                SixGaming.tmiQueue("You're all set, " + from + ". You are now a Six Gaming streamer!");
                                SixGaming.discordQueue(user + " is now setup as a Six Gaming streamer at http://twitch.tv/" + from + " and their Discord channel has been created at " + channel + ".");
                                streamers.push(from.toLowerCase());
                                hostIndex = hosts.indexOf(from);
                                if (hostIndex !== -1) {
                                    hosts.splice(hostIndex, 1);
                                }
                            }).catch(function(err) {
                                console.log("Problem creating channel.");
                                console.log(err);
                            });
                        }
                    );
                }
            );
        }
    }
};

SixGaming.discordMessage = function(from, user, text) {
    var matches = messageParse.exec(text);

    if (matches) {
        if (SixGaming.discordMessages[matches[1]]) {
            SixGaming.discordMessages[matches[1]].call(this, from, user, matches[2]);
        }
    }
};

SixGaming.discordMessages = {
    version: function(from, user, message) {
        if (!message) {
            SixGaming.discordQueue("SixBotGG by roncli, Version " + pjson.version);
        }
    },

    host: function(from, user, message) {
        if (message && SixGaming.isPodcaster(user)) {
            if (liveChannels["SixGamingGG"]) {
                SixGaming.discordQueue("Sorry, " + user + ", but Six Gaming is live right now!");
                return;
            }

            if (hostingTimestamps.length > 2 && hostingTimestamps[0] + 1805000 > new Date().getTime()) {
                SixGaming.discordQueue("Sorry, " + user + ", but I can only host 3 times within 30 minutes.");
                return;
            }

            twitch.getChannelStream(message, function(err, results) {
                manualHosting = !err && results && results.stream;
                if (manualHosting) {
                    currentHost = message;
                    SixGaming.tmiQueue("Now hosting " + currentHost + ".  Check out their stream at http://twitch.tv/" + currentHost + "!");
                    tmi.host("sixgaminggg", currentHost).catch(function(err) {
                        if (err !== "bad_host_hosting") {
                            console.log("Problem hosting channel.");
                            console.log(err);
                        }
                    });
                    if (results.stream.game) {
                        SixGaming.discordQueue(message + " has been hosted by Six Gaming on Twitch, with \"" + results.stream.game + "\": \"" + results.stream.channel.status + "\"  Watch at http://twitch.tv/" + message, liveStreamAnnouncementsChannel);
                    } else {
                        SixGaming.discordQueue(message + " has been hosted by Six Gaming on Twitch: \"" + results.stream.channel.status + "\"  Watch at http://twitch.tv/" + message, liveStreamAnnouncementsChannel);
                    }
                    SixGaming.discordQueue("Now hosting " + currentHost + ".  Check out their stream at http://twitch.tv/" + currentHost + "!");

                    lastHost = 0;
                    hostingTimestamps.push(new Date().getTime());
                    while (hostingTimestamps.length > 3) {
                        hostingTimestamps.splice(0, 1);
                    }
                } else {
                    SixGaming.discordQueue("Sorry, " + from + ", but " + message + " is not live right now.");
                }
            });
        }
    },

    unhost: function(from, user, message) {
        if (!message && SixGaming.isPodcaster(user)) {
            tmi.unhost("sixgaminggg");
            SixGaming.discordQueue("Exiting host mode.");
            manualHosting = false;
            currentHost = "";
        }
    },

    addtwitch: function(from, user, message) {
        if (message) {
            twitch.getChannelStream(message, function(err, results) {
                if (err || !results) {
                    SixGaming.discordQueue("Sorry, " + user + ", but " + message + " is not a valid Twitch streamer.");
                    return;
                }

                db.query(
                    "select discord, code, validated from streamer where streamer = @streamer",
                    {streamer: {type: db.VARCHAR(50), value: message}},
                    function(err, data) {
                        var id = user.id,
                            code;

                        if (err) {
                            SixGaming.discordQueue("Sorry, " + user + ", but the server is currently down.  Try later, or get a hold of roncli for fixing.");
                            return;
                        }

                        if (data && data[0] && data[0][0]) {
                            if (data[0][0].discord !== id) {
                                let users = discord.users.findAll("id", data[0][0].discord),
                                    registeredUser;
                                
                                if (users.length !== 0) {
                                    registeredUser = users[0];
                                    SixGaming.discordQueue("Sorry, " + user + ", but " + message + " has already been registered by " + registeredUser + ".  If this is in error, get a hold of roncli for fixing.");
                                }

                                return;
                            }

                            if (data[0][0].validated) {
                                SixGaming.discordQueue("Sorry, " + user + ", but you're already validated!");
                                return;
                            }

                            SixGaming.discordQueue(user + ", please log in to Twitch as " + message + ", visit http://twitch.tv/SixGamingGG, and enter the command `!confirm " + data[0][0].code + "` into chat.");
                            return;
                        }

                        code = Math.floor(Math.random() * 900 + 100);
                        db.query(
                            "insert into streamer (streamer, discord, code) values (@streamer, @discord, @code)",
                            {
                                streamer: {type: db.VARCHAR(50), value: message},
                                discord: {type: db.VARCHAR(50), value: id},
                                code: {type: db.INT, value: code}
                            },
                            function(err) {
                                if (err) {
                                    SixGaming.discordQueue("Sorry, " + user + ", but the server is currently down.  Try later, or get a hold of roncli for fixing.");
                                    return;
                                }

                                SixGaming.discordQueue(user + ", please log in to Twitch as " + message + ", visit http://twitch.tv/SixGamingGG, and enter the command `!confirm " + code + "` into chat.");
                            }
                        )
                    }
                )
            });
        }
    },

    removetwitch: function(from, user, message) {
        if (!message) {
            db.query(
                "select id, streamer from streamer where discord = @discord",
                {discord: {type: db.VARCHAR(50), value: user.id}},
                function(err, data) {
                    var id, streamer;

                    if (err) {
                        SixGaming.discordQueue("Sorry, " + user + ", but the server is currently down.  Try later, or get a hold of roncli for fixing.");
                        return;
                    }

                    if (!data || !data[0] || !data[0][0]) {
                        SixGaming.discordQueue(user + ", you are not currently registered as a streamer.");
                        return;
                    }

                    id = data[0][0].id;
                    streamer = data[0][0].streamer;

                    db.query(
                        "delete from streamer where id = @id",
                        {id: {type: db.INT, value: id}},
                        function(err) {
                            var streamerIndex;

                            if (err) {
                                SixGaming.discordQueue("Sorry, " + user + ", but the server is currently down.  Try later, or get a hold of roncli for fixing.");
                                return;
                            }

                            sixDiscord.member(user).removeRole(streamersRole);

                            sixDiscord.channels.find("name", "twitch-" + streamer).delete();

                            streamerIndex = streamers.indexOf(streamer);
                            if (streamerIndex !== -1) {
                                streamers.splice(streamerIndex, 1);
                            }
                            SixGaming.discordQueue(user + ", you have been removed as a streamer.");
                        }
                    )
                }
            );
        }
    },

    addstreamer: function(from, user, message) {
        if (message && SixGaming.isPodcaster(user)) {
            twitch.getChannelStream(message, function(err, results) {
                if (err || !results) {
                    SixGaming.discordQueue("Sorry, " + user + ", but " + message + " is not a valid Twitch streamer.");
                    return;
                }

                db.query(
                    "select streamer from host where streamer = @streamer",
                    {streamer: {type: db.VARCHAR(50), value: message}},
                    function(err, data) {
                        if (err) {
                            SixGaming.discordQueue("Sorry, " + user + ", but the server is currently down.  Try later, or get a hold of roncli for fixing.");
                            return;
                        }

                        if (data && data[0] && data[0][0]) {
                            SixGaming.discordQueue("Sorry, " + user + ", but " + message + " is already added as a streamer to be hosted.");
                            return;
                        }

                        db.query(
                            "insert into host (streamer) values (@streamer)",
                            {
                                streamer: {type: db.VARCHAR(50), value: message}
                            },
                            function(err) {
                                if (err) {
                                    SixGaming.discordQueue("Sorry, " + user + ", but the server is currently down.  Try later, or get a hold of roncli for fixing.");
                                    return;
                                }

                                hosts.push(message.toLowerCase());
                                SixGaming.discordQueue(user + ", you have successfully added " + message + " as a streamer to be hosted.");
                            }
                        )
                    }
                )
            });
        }
    },

    removestreamer: function(from, user, message) {
        if (message && SixGaming.isPodcaster(user)) {
            db.query(
                "select id from host where streamer = @streamer",
                {streamer: {type: db.VARCHAR(50), value: message}},
                function(err, data) {
                    var id;

                    if (err) {
                        SixGaming.discordQueue("Sorry, " + user + ", but the server is currently down.  Try later, or get a hold of roncli for fixing.");
                        return;
                    }

                    if (!data || !data[0] || !data[0][0]) {
                        SixGaming.discordQueue(user + ", " + message + " is not currently a hosted streamer.");
                        return;
                    }

                    id = data[0][0].id;

                    db.query(
                        "delete from host where id = @id",
                        {id: {type: db.INT, value: id}},
                        function(err) {
                            var hostIndex;

                            if (err) {
                                SixGaming.discordQueue("Sorry, " + user + ", but the server is currently down.  Try later, or get a hold of roncli for fixing.");
                                return;
                            }

                            hostIndex = hosts.indexOf(message);
                            if (hostIndex !== -1) {
                                hosts.splice(hostIndex, 1);
                            }

                            SixGaming.discordQueue(user + ", " + message + " has been removed as a hosted streamer.");
                        }
                    )
                }
            );
        }
    },

    addchannel: function(from, user, message) {
        if (message) {
            if (userCreatedChannels[user.id]) {
                SixGaming.discordQueue("Sorry, " + user + ", but you can only create a voice channel once every five minutes.");
                return;
            }

            if (sixDiscord.channels.findAll("name", message).length !== 0) {
                SixGaming.discordQueue("Sorry, " + user + ", but " + message + " already exists as a voice channel.");
                return;
            }

            sixDiscord.createChannel(message, "voice").then(function(channel) {
                if (channel.members.size === 0) {
                    SixGaming.markEmptyVoiceChannel(channel);
                }
                userCreatedChannels[user.id] = setTimeout(function() {
                    delete userCreatedChannels[user.id];
                }, 300000);
                SixGaming.discordQueue(user + ", the voice channel " + message + " has been created.  It will be automatically deleted after being empty for 5 minutes.");
            }).catch(function(err) {
                console.log(err);
                SixGaming.discordQueue("Sorry, " + user + ", but there was a problem with adding this Discord channel.");
            });
        }
    },

    addgame: function(from, user, message) {
        var matches = addGameParse.exec(message),
            short, game;

        if (message && SixGaming.isPodcaster(user) && matches) {
            short = matches[1].toLowerCase();
            game = matches[2];

            if (sixDiscord.roles.findAll("name", short).length !== 0) {
                SixGaming.discordQueue("Sorry, " + user + ", but the role for game " + short + " has already been created.");
                return;
            }

            sixDiscord.createRole({
                name: short,
                color: 0xFF0000,
                hoist: false,
                mentionable: true
            }).then(function(role) {
                sixDiscord.member(user).addRole(role);

                db.query(
                    "insert into game (game, code) values (@game, @code)",
                    {
                        game: {type: db.VARCHAR(255), value: game},
                        code: {type: db.VARCHAR(50), value: short}
                    },
                    function() {}
                );

                sixDiscord.createChannel("game-" + short, "text").then(function(channel) {
                    channel.setTopic("This channel is for discussion of " + game + ".  Enter `!notify " + short + "` in #sixbotgg to be notified when others wish to play.  Mention @" + short + " to alert others when you wish to play!").then(function() {
                        channel.setPosition(9999).then(SixGaming.sortDiscordChannels).catch(function(err) {
                            console.log("Problem setting position on channel.");
                            console.log(err);
                        });;
                    }).catch(function(err) {
                        console.log("Problem setting topic of channel.");
                        console.log(err);
                    });

                    SixGaming.discordQueue(user + ", " + role + " has been setup as a mentionable role with you as the first member!  You may also discuss the game " + game + " in " + channel + ".  Anyone may join this role to be notified by entering `!notify " + short + "`.");
                }).catch(function(err) {
                    console.log("Problem creating channel.");
                    console.log(err);
                });;
            }).catch(function(err) {
                console.log(err);
                SixGaming.discordQueue("Sorry, " + user + ", but there was a problem with adding this role to Discord.");
            });
        }
    },

    removegame: function(from, user, message) {
        if (message && user.username === settings.admin.username && user.discriminator == settings.admin.discriminator) {
            message = message.toLowerCase();

            if (sixDiscord.roles.findAll("name", message).length === 0) {
                SixGaming.discordQueue("Sorry, " + user + ", but the game " + message + " does not exist.");
                return;
            }

            if (sixDiscord.channels.findAll("name", "game-" + message).length === 0) {
                SixGaming.discordQueue("Sorry, " + user + ", but the role " + message + " is not a role that can be removed using this command.");
                return;
            }

            sixDiscord.roles.find("name", message).delete();
            sixDiscord.channels.find("name", "game-" + message).delete();

            db.query(
                "delete from game where code = @code", {code: {type: db.VARCHAR(50), value: message}}, function() {}
            );

            SixGaming.discordQueue(user + ", the game " + message + " has been removed.");
        }
    },

    notify: function(from, user, message) {
        if (message) {
            var role;

            message = message.toLowerCase();

            if (sixDiscord.roles.findAll("name", message).length === 0) {
                SixGaming.discordQueue("Sorry, " + user + ", but the game " + message + " does not exist.");
                return;
            }

            if (sixDiscord.channels.findAll("name", "game-" + message).length === 0) {
                SixGaming.discordQueue("Sorry, " + user + ", but the role " + message + " is not a role that you can be notified for using this command.");
                return;
            }

            role = sixDiscord.roles.find("name", message);

            sixDiscord.member(user).addRole(role).then(function() {
                SixGaming.discordQueue(user + ", you have been setup to be notified whenever " + role.name + " is mentioned!");
            }).catch(function(err) {
                console.log(err);
                SixGaming.discordQueue("Sorry, " + user + ", but there was a problem with setting you up to be notified in Discord.  Are you sure you're not already setup to be notified for this game?");
            });
        }
    },

    unnotify: function(from, user, message) {
        if (message) {
            var role;

            message = message.toLowerCase();

            if (sixDiscord.roles.findAll("name", message).length === 0) {
                SixGaming.discordQueue("Sorry, " + user + ", but the game " + message + " does not exist.");
                return;
            }

            if (sixDiscord.channels.findAll("name", "game-" + message).length === 0) {
                SixGaming.discordQueue("Sorry, " + user + ", but the role " + message + " is not a role that you can be notified for using this command.");
                return;
            }

            role = sixDiscord.roles.find("name", message);

            // For discord.js 9.0.3 and later:
            sixDiscord.member(user).removeRole(role).then(function() {
                SixGaming.discordQueue(user + ", you have been setup to no longer be notified whenever " + role.name + " is mentioned!");
            }).catch(function(err) {
                console.log(err);
                SixGaming.discordQueue("Sorry, " + user + ", but there was a problem with setting you up to not be notified in Discord.  Are you sure you were setup to be notified for this game?");
            });
        }
    },

    games: function(from, user, message) {
        if (!message) {
            db.query(
                "select game, code from game order by code", {}, function(err, data) {
                    var response = "You may use `!notify <game>` for the following games:";

                    if (err || !data || !data[0]) {
                        SixGaming.tmiQueue("Sorry, " + from + ", but the server is currently down.  Try later, or get a hold of roncli for fixing.");
                        return;
                    }

                    data[0].forEach(function(row) {
                        response += "\n`" + row.code + "` - " + row.game;
                    });

                    SixGaming.discordQueue(response, user);
                }
            )
        }
    },

    randomonium: function(from, user, message) {
        var voiceChannel = sixDiscord.member(user).voiceChannel,
            index = 0;

        if (!voiceChannel) {
            SixGaming.discordQueue("Sorry, " + user + ", but you must be in a voice channel to use this command.");
            return;
        }

        owHeroes.sort(function() {
            return Math.random() - 0.5;
        });

        voiceChannel.members.forEach(function(member) {
            if (voiceChannel && member.voiceChannel && voiceChannel.id === member.voiceChannel.id) {
                SixGaming.discordQueue(member + ": " + owHeroes[index]);
                if (message === "dupe" || message === "dupes") {
                    owHeroes.sort(function() {
                        return Math.random() - 0.5;
                    });
                }
                index++;
            }
        });
    },

    help: function(from, user, message) {
        if (!message) {
            SixGaming.discordQueue(user + ", see the documentation in " + sixDiscord.channels.find("name", "six-gaming-info") + ".");
        }
    }
};

module.exports = SixGaming;
