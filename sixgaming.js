var pjson = require("./package.json"),
    messageParse = /^!([^ ]+)(?: (.*))?$/,
    nicks = {},
    sixIsLive = true,
    streamers = [
        "Ahderi",
        "bifwiggles",
        "Broxbeeble",
        "ColzGaming",
        "Elkslayer666",
        "Elthias",
        "Kirozane",
        "MrFu709",
        "Obadiah332",
        "Pentharian",
        "RikiGuitarist",
        "roncli",
        "Showsan",
        "Solitha0620",
        "Sophothy",
        "SpaceCptDamien",
        "Sweetooth0613",
        "Theriegs",
        "vegetto1334",
        "Wildestbill"
    ],
    autoCommandRotation = [
        "facebook",
        "twitter",
        "youtube",
        "itunes"
    ],
    commandRotationWait = 5,
    commandRotationTimeout = 0,
    nextCheckHost = 0,
    currentHost = "",
    manualHosting = false,
    client, twitch;

SixGaming = {};

SixGaming.start = function(_client, _twitch) {
    client = _client;
    twitch = _twitch;

    var checkHosting = function() {
        var hosted = false,
            index = 0,
            tryHosting = function() {
                twitch.getChannelStream(streamers[index], function(err, results) {
                    if (err) {
                        index++;
                    } else {
                        if (results.stream) {
                            hosted = true;
                        } else {
                            index++;
                        }
                    }

                    if (!hosted && index < streamers.length) {
                        tryHosting();
                        return;
                    }

                    nextCheckHost = 0;

                    if (hosted) {
                        if (hosted && currentHost !== streamers[index]) {
                            currentHost = streamers[index];
                            streamers.splice(index, 1);
                            streamers.push(currentHost);
                            SixGaming.queue("Now hosting " + currentHost + ".  Check out their stream at http://twitch.tv/" + currentHost + "!");
                            SixGaming.queue("/host " + currentHost);
                        }
                        nextCheckHost = 10;
                        setTimeout(checkSixIsLive, 60000);
                        return;
                    }

                    currentHost = "";
                    setTimeout(checkSixIsLive, 60000);
                });
            };

        tryHosting();
    },

        checkSixIsLive = function() {
            twitch.getChannelStream("sixgaminggg", function(err, results) {
                sixIsLive = !err && results && results.stream;
                if (sixIsLive && currentHost) {
                    currentHost = "";
                    manualHosting = false;
                    nextCheckHost = 0;
                    SixGaming.queue("Ladies and gentlemen, Six Gaming is live!");
                    SixGaming.queue("/unhost");
                }

                if (currentHost !== "") {
                    twitch.getChannelStream(currentHost, function(err, results) {
                        manualHosting = !err && results && results.stream;
                        if (!manualHosting) {
                            checkHosting();
                        } else {
                            setTimeout(checkSixIsLive, 60000);
                        }
                    });
                } else {
                    nextCheckHost--;
                    if (!sixIsLive && !manualHosting && nextCheckHost <= 0) {
                        checkHosting();
                    } else {
                        setTimeout(checkSixIsLive, 60000);
                    }
                }
            });
        };

    client.connect(function() {
        client.addListener("raw", function(message) {
            //console.log(message);
        });

        client.addListener("error", function(message) {
            console.log("ERROR", message);
        });

        client.send("/raw CAP REQ :twitch.tv/membership");

        client.join("#sixgaminggg");

        client.addListener("message#sixgaminggg", function(from, text, message) {
            SixGaming.message(from, text, message);
        });

        client.addListener("names#sixgaminggg", function(nicks) {
            SixGaming.names(nicks);
        });

        client.addListener("join#sixgaminggg", function(nick, message) {
            SixGaming.join(nick, message);
        });

        client.addListener("part#sixgaminggg", function(nick, reason, message) {
            SixGaming.part(nick, reason, message);
        });

        client.addListener("+mode", function(channel, by, mode, argument, message) {
            if (channel === "#sixgaminggg") {
                SixGaming["+mode"](by, mode, argument, message);
            }
        });

        client.addListener("-mode", function(channel, by, mode, argument, message) {
            if (channel === "#sixgaminggg") {
                SixGaming["-mode"](by, mode, argument, message);
            }
        });
    });

    checkSixIsLive();
    SixGaming.commandRotation();
};

SixGaming.commandRotation = function() {
    if (commandRotationWait <= 0) {
        SixGaming.messages[autoCommandRotation[0]]("SixBotGG");
    }

    commandRotationTimeout = setTimeout(function() {
        SixGaming.commandRotation();
    }, 600000);
};

SixGaming.queue = function(message) {
    client.say("#SixGamingGG", message);
};

SixGaming.names = function(_nicks) {
    nicks = _nicks;
};

SixGaming.join = function(nick, message) {
    nicks[nick] = "";
};

SixGaming.part = function(nick, reason, message) {
    delete(nicks[nick]);
};

SixGaming["+mode"] = function(by, mode, argument, message) {
    if (mode === "o") {
        nicks[message.args[2]] = "o";
        SixGaming.queue("Hi, " + message.args[2] + "! HeyGuys");
    }
};

SixGaming["-mode"] = function(by, mode, argument, message) {
    if (mode === "o") {
        if (nicks[message.args[2]] === "o") {
            nicks[message.args[2]] = "";
        }
    }
};

SixGaming.isAdmin = function(name) {
    return nicks[name] === "o";
};

SixGaming.message = function(from, text, message) {
    var matches = messageParse.exec(text);

    commandRotationWait--;

    if (matches) {
        if (SixGaming.messages[matches[1]]) {
            SixGaming.messages[matches[1]].call(this, from, matches[2]);
        }
    }
};

SixGaming.messages = {
    facebook: function(from, message) {
        if (!message) {
            var index = autoCommandRotation.indexOf("facebook");
            if (index !== -1) {
                commandRotationWait = 5;
                autoCommandRotation.splice(index, 1);
                autoCommandRotation.push("facebook");
            }
            SixGaming.queue("Check out Six Gaming on Facebook at http://fb.me/SixGamingGG");
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
            SixGaming.queue("Follow Six Gaming on Twitter at http://twitter.com/SixGamingGG");
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
            SixGaming.queue("Visit Six Gaming's YouTube page for a complete archive of our podcast at http://ronc.li/six-youtube");
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
            SixGaming.queue("Subscribe to Six Gaming's video podcast on iTunes at http://ronc.li/six-itunes");
            clearTimeout(commandRotationTimeout);
            commandRotationTimeout = setTimeout(function() {
                SixGaming.commandRotation();
            }, 600000);
        }
    },

    version: function(from, message) {
        if (!message) {
            SixGaming.queue("SixBotGG by roncli, Version " + pjson.version);
        }
    },

    host: function(from, message) {
        if (message && SixGaming.isAdmin(from)) {
            if (sixIsLive) {
                SixGaming.queue("Sorry, but Six Gaming is live right now!");
            } else {
                twitch.getChannelStream(message, function(err, results) {
                    manualHosting = !err && results && results.stream;
                    if (manualHosting) {
                        currentHost = message;
                        SixGaming.queue("Now hosting " + currentHost + ".  Check out their stream at http://twitch.tv/" + currentHost + "!");
                        SixGaming.queue("/host " + currentHost);
                        nextCheckHost = 0;
                    } else {
                        SixGaming.queue("Sorry, " + from + ", but " + message + " is not live right now.");
                    }
                });
            }
        }
    },

    unhost: function(from, message) {
        if (!message && SixGaming.isAdmin(from)) {
            SixGaming.queue("/unhost");
            manualHosting = false;
            currentHost = "";
            nextCheckHost = 0;
        }
    }
};

module.exports = SixGaming;
