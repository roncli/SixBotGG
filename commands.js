const Db = require("./db"),
    Discord = require("./discord"),
    Exception = require("./exception"),
    pjson = require("./package.json"),
    randomonium = require("./randomonium"),
    Tmi = require("./tmi"),
    Twitch = require("./twitch"),

    addGameParse = /^([a-zA-Z0-9]{2,50}) +(.{2,255})$/,
    codeParse = /^[1-9][0-9]{2}$/,
    userCreatedChannels = {};

//   ###                                          #
//  #   #                                         #
//  #       ###   ## #   ## #    ###   # ##    ## #   ###
//  #      #   #  # # #  # # #      #  ##  #  #  ##  #
//  #      #   #  # # #  # # #   ####  #   #  #   #   ###
//  #   #  #   #  # # #  # # #  #   #  #   #  #  ##      #
//   ###    ###   #   #  #   #   ####  #   #   ## #  ####
/**
 * A class that handles commands given by chat.
 */
class Commands {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Initializes the class with the service to use.
     * @param {Discord|Tmi} service The service to use with the commands.
     */
    constructor(service) {
        this.service = service;
    }

    //          #         #          ###                      #
    //          #                    #  #
    //  ###   ###  # #   ##    ###   #  #  ###    ##   # #   ##     ###    ##
    // #  #  #  #  ####   #    #  #  ###   #  #  #  #  ####   #    ##     # ##
    // # ##  #  #  #  #   #    #  #  #     #     #  #  #  #   #      ##   ##
    //  # #   ###  #  #  ###   #  #  #     #      ##   #  #  ###   ###     ##
    /**
     * A promise that only proceeds if the user is an admin.
     * @param {string|User} user The user to check.
     * @param {function} fx The function to run with the promise.
     * @returns {Promise} A promise that resolves if the user is an admin.
     */
    static adminPromise(user, fx) {
        return new Promise((resolve, reject) => {
            if (!(this.service.constructor.name === "Discord" && Discord.isPodcaster(user) || this.service.constructor.name === "Tmi" && Tmi.isMod(user))) {
                reject(new Error("Admin permission required to perform this command."));
                return;
            }

            resolve();
        }).then(new Promise(fx));
    }

    //    #   #                                #  ###                      #
    //    #                                    #  #  #
    //  ###  ##     ###    ##    ##   ###    ###  #  #  ###    ##   # #   ##     ###    ##
    // #  #   #    ##     #     #  #  #  #  #  #  ###   #  #  #  #  ####   #    ##     # ##
    // #  #   #      ##   #     #  #  #     #  #  #     #     #  #  #  #   #      ##   ##
    //  ###  ###   ###     ##    ##   #      ###  #     #      ##   #  #  ###   ###     ##
    /**
     * A promise that only proceeds if the user is on Discord.
     * @param {function} fx The function to run with the promise.
     * @returns {Promise} A promise that resolves if the user is on Discord.
     */
    static discordPromise(fx) {
        return new Promise((resolve, reject) => {
            if (this.service.constructor.name !== "Discord") {
                reject(new Error("This command is for Discord only."));
                return;
            }

            resolve();
        }).then(new Promise(fx));
    }

    //                               ###                      #
    //                               #  #
    //  ##   #  #  ###    ##   ###   #  #  ###    ##   # #   ##     ###    ##
    // #  #  #  #  #  #  # ##  #  #  ###   #  #  #  #  ####   #    ##     # ##
    // #  #  ####  #  #  ##    #     #     #     #  #  #  #   #      ##   ##
    //  ##   ####  #  #   ##   #     #     #      ##   #  #  ###   ###     ##
    /**
     * A promise that only proceeds if the user is the owner.
     * @param {User} user The user to check.
     * @param {function} fx The function to run with the promise.
     * @returns {Promise} A promise that resolves if the user is the owner.
     */
    static ownerPromise(user, fx) {
        return new Promise((resolve, reject) => {
            if (typeof user === "string" || !Discord.isOwner(user)) {
                reject(new Error("Owner permission required to perform this command."));
                return;
            }

            resolve();
        }).then(new Promise(fx));
    }

    //  #           #    ###                      #
    //  #                #  #
    // ###   # #   ##    #  #  ###    ##   # #   ##     ###    ##
    //  #    ####   #    ###   #  #  #  #  ####   #    ##     # ##
    //  #    #  #   #    #     #     #  #  #  #   #      ##   ##
    //   ##  #  #  ###   #     #      ##   #  #  ###   ###     ##
    /**
     * A promise that only proceeds if the user is on tmi.
     * @param {function} fx The function to run with the promise
     * @returns {Promise} A promise that resolves if the user is on tmi.
     */
    static tmiPromise(fx) {
        return new Promise((resolve, reject) => {
            if (this.service.constructor.name !== "Tmi") {
                reject(new Error("This command is for Twitch chat only."));
                return;
            }

            resolve();
        }).then(new Promise(fx));
    }

    //   #                     #                 #
    //  # #                    #                 #
    //  #     ###   ##    ##   ###    ##    ##   # #
    // ###   #  #  #     # ##  #  #  #  #  #  #  ##
    //  #    # ##  #     ##    #  #  #  #  #  #  # #
    //  #     # #   ##    ##   ###    ##    ##   #  #
    /**
     * Replies with Six Gaming's Facebook URL.  Tmi-only.
     * @param {string|User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    facebook(user, message) {
        const commands = this;

        return Commands.tmiPromise((resolve) => {
            if (message) {
                resolve(false);
                return;
            }

            commands.service.queue("Check out Six Gaming on Facebook at http://fb.me/SixGamingGG");
            Tmi.rotateCommand("facebook");
            resolve(true);
        });
    }

    //  #           #     #     #
    //  #                 #     #
    // ###   #  #  ##    ###   ###    ##   ###
    //  #    #  #   #     #     #    # ##  #  #
    //  #    ####   #     #     #    ##    #
    //   ##  ####  ###     ##    ##   ##   #
    /**
     * Replies with Six Gaming's Twitter URL.  Tmi-only.
     * @param {string|User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    twitter(user, message) {
        const commands = this;

        return Commands.tmiPromise((resolve) => {
            if (message) {
                resolve(false);
                return;
            }

            commands.service.queue("Follow Six Gaming on Twitter at http://twitter.com/SixGamingGG");
            Tmi.rotateCommand("twitter");
            resolve(true);
        });
    }

    //                    #          #
    //                    #          #
    // #  #   ##   #  #  ###   #  #  ###    ##
    // #  #  #  #  #  #   #    #  #  #  #  # ##
    //  # #  #  #  #  #   #    #  #  #  #  ##
    //   #    ##    ###    ##   ###  ###    ##
    //  #
    /**
     * Replies with Six Gaming's YouTube URL.  Tmi-only.
     * @param {string|User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    youtube(user, message) {
        const commands = this;

        return Commands.tmiPromise((resolve) => {
            if (message) {
                resolve(false);
                return;
            }

            commands.service.queue("Visit Six Gaming's YouTube page for a complete archive of our podcast at http://ronc.li/six-youtube");
            Tmi.rotateCommand("youtube");
            resolve(true);
        });
    }

    //  #     #
    //        #
    // ##    ###   #  #  ###    ##    ###
    //  #     #    #  #  #  #  # ##  ##
    //  #     #    #  #  #  #  ##      ##
    // ###     ##   ###  #  #   ##   ###
    /**
     * Replies with Six Gaming's iTunes URL.  Tmi-only.
     * @param {string|User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    itunes(user, message) {
        const commands = this;

        return Commands.tmiPromise((resolve) => {
            if (message) {
                resolve(false);
                return;
            }

            commands.service.queue("Subscribe to Six Gaming's video podcast on iTunes at http://ronc.li/six-itunes");
            Tmi.rotateCommand("itunes");
            resolve(true);
        });
    }

    //    #   #                                #
    //    #                                    #
    //  ###  ##     ###    ##    ##   ###    ###
    // #  #   #    ##     #     #  #  #  #  #  #
    // #  #   #      ##   #     #  #  #     #  #
    //  ###  ###   ###     ##    ##   #      ###
    /**
     * Replies with Six Gaming's Discord URL.  Tmi-only.
     * @param {string|User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    discord(user, message) {
        const commands = this;

        return Commands.tmiPromise((resolve) => {
            if (message) {
                resolve(false);
                return;
            }

            commands.service.queue("Join the Six Gaming Discord server for all the memes!  We are a community of gamers that enjoy playing together.  Join at http://ronc.li/six-discord");
            Tmi.rotateCommand("discord");
            resolve(true);
        });
    }

    //             #             #     #
    //             #                   #
    // #  #   ##   ###    ###   ##    ###    ##
    // #  #  # ##  #  #  ##      #     #    # ##
    // ####  ##    #  #    ##    #     #    ##
    // ####   ##   ###   ###    ###     ##   ##
    /**
     * Replies with Six Gaming's Website URL.  Tmi-only.
     * @param {string|User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    website(user, message) {
        const commands = this;

        return Commands.tmiPromise((resolve) => {
            if (message) {
                resolve(false);
                return;
            }

            commands.service.queue("We have a website?  Yes, we do!  Visit us at http://six.gg for everything Six Gaming!");
            Tmi.rotateCommand("website");
            resolve(true);
        });
    }

    //                           #
    //
    // # #    ##   ###    ###   ##     ##   ###
    // # #   # ##  #  #  ##      #    #  #  #  #
    // # #   ##    #       ##    #    #  #  #  #
    //  #     ##   #     ###    ###    ##   #  #
    /**
     * Replies with the current version of the bot.
     * @param {string|User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    version(user, message) {
        const commands = this;

        return new Promise((resolve) => {
            if (message) {
                resolve(false);
                return;
            }

            commands.service.queue(`SixBotGG by roncli, Version ${pjson.version}`);
            resolve(true);
        });
    }

    // #           ##
    // #            #
    // ###    ##    #    ###
    // #  #  # ##   #    #  #
    // #  #  ##     #    #  #
    // #  #   ##   ###   ###
    //                   #
    /**
     * Replies with a URL to the bot's help page.
     * @param {string|User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    help(user, message) {
        const commands = this;

        return new Promise((resolve) => {
            if (message) {
                resolve(false);
                return;
            }

            commands.service.queue(`${user}, see the documentation at http://six.gg/about.`);
            resolve(true);
        });
    }

    // #                   #
    // #                   #
    // ###    ##    ###   ###
    // #  #  #  #  ##      #
    // #  #  #  #    ##    #
    // #  #   ##   ###      ##
    /**
     * Hosts a channel.  Admin-only.
     * @param {string|User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    host(user, message) {
        const commands = this;

        return Commands.adminPromise(user, (resolve, reject) => {
            if (message) {
                resolve(false);
                return;
            }

            if (Discord.isSixGamingLive()) {
                commands.service.queue(`Sorry, ${user}, but Six Gaming is live right now!`);
                reject(new Error("Cannot host a channel while Six Gaming is live."));
                return;
            }

            if (Discord.canHost()) {
                commands.service.queue(`Sorry, ${user}, but I can only host 3 times within 30 minutes.`);
                reject(new Error("Cannot host a channel when 3 channels have been hosted in the past 30 minutes."));
                return;
            }

            Twitch.getChannelStream(message).then((results) => {
                Discord.manualHosting = results && results.stream;

                if (Discord.manualHosting) {
                    Discord.currentHost = message;
                    Tmi.host("sixgaminggg", Discord.currentHost).then(() => {
                        Tmi.queue(`Now hosting ${Discord.currentHost}.  Check out their stream at http://twitch.tv/${Discord.currentHost}!`);
                        Discord.announceStream(Discord.currentHost, results.stream.game, results.stream.channel.status);
                        resolve(true);
                    }).catch((err) => {
                        commands.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
                        reject(new Exception("There was a Twitch chat error while attempting to host a channel.", err));
                    });

                    return;
                }

                if (results) {
                    commands.service.queue(`Sorry, ${user}, but ${message} is not live right now.`);
                    reject(new Error("Cannot host a channel that is not live."));
                } else {
                    commands.service.queue(`Sorry, ${user}, but ${message} is not a valid Twitch streamer.`);
                    reject(new Error("Channel does not exist."));
                }
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
                reject(new Exception("There was a Twitch API error while getting stream data.", err));
            });
        });
    }

    //             #                   #
    //             #                   #
    // #  #  ###   ###    ##    ###   ###
    // #  #  #  #  #  #  #  #  ##      #
    // #  #  #  #  #  #  #  #    ##    #
    //  ###  #  #  #  #   ##   ###      ##
    /**
     * Unhosts a channel.  Admin-only.
     * @param {string|User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    unhost(user, message) {
        const commands = this;

        return Commands.adminPromise(user, (resolve, reject) => {
            if (message) {
                resolve(false);
                return;
            }

            if (!Discord.currentHost) {
                commands.service.queue(`Sorry, ${user}, but you can't stop hosting when the channel isn't hosting anyone.`);
                reject(new Error("Not currently hosting a channel."));
                return;
            }

            Tmi.unhost("sixgaminggg");
            commands.service.queue("Exiting host mode.");
            Discord.manualHosting = false;
            Discord.currentHost = "";
            resolve(true);
        });
    }

    //                     #    #
    //                    # #
    //  ##    ##   ###    #    ##    ###   # #
    // #     #  #  #  #  ###    #    #  #  ####
    // #     #  #  #  #   #     #    #     #  #
    //  ##    ##   #  #   #    ###   #     #  #
    /**
     * Confirms the link between a Discord user and a Twitch user.  Tmi-only.
     * @param {string|User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    confirm(user, message) {
        const commands = this;

        return Commands.tmiPromise((resolve, reject) => {
            if (!message || !codeParse.test(message)) {
                resolve(false);
                return;
            }

            const code = +message;

            Db.query(
                "select discord from streamer where streamer = @streamer and code = @code",
                {
                    streamer: {type: Db.VARCHAR(50), value: user},
                    code: {type: Db.INT, value: code}
                }
            ).then((data) => {
                if (data.recordsets[0].length === 0) {
                    reject(new Error("The streamer's code did not match what was expected."));
                    return;
                }

                const {discord: id} = data.recordsets[0][0];

                Db.query(
                    "update streamer set code = 0, validated = 1 where streamer = @streamer;delete from host where streamer = @streamer",
                    {streamer: {type: Db.VARCHAR(50), value: user}}
                ).then(() => {
                    const discordUsers = Discord.findUserById(id);

                    if (discordUsers.length === 0) {
                        commands.service.queue(`Sorry, ${user}, but you appear to have left the Discord server.  Please rejoin at http://ronc.li/six-discord and then try the !confirm command again.`);
                        reject(new Error("Cannot find user on the Discord server."));
                        return;
                    }

                    const discordUser = discordUsers[0];

                    Discord.addStreamersRole(discordUser);

                    Tmi.queue(`You're all set, ${user}. You are now a Six Gaming streamer!`);
                    Discord.queue(`${discordUser}, you are now setup as a Six Gaming streamer at http://twitch.tv/${user}.  If you would like a text channel on Discord for your Twitch community, you can use \`!addmychannel\`.`);
                    Discord.addStreamer(user.toLowerCase());
                    Discord.removeHost(user.toLowerCase());

                    resolve(true);
                }).catch((err) => {
                    commands.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
                    reject(new Exception("There was a database error while setting a streamer to be validated.", err));
                });
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
                reject(new Exception("There was a database error while checking for a streamer's validation code.", err));
            });
        });
    }

    //          #     #  ###          #     #          #
    //          #     #   #                 #          #
    //  ###   ###   ###   #    #  #  ##    ###    ##   ###
    // #  #  #  #  #  #   #    #  #   #     #    #     #  #
    // # ##  #  #  #  #   #    ####   #     #    #     #  #
    //  # #   ###   ###   #    ####  ###     ##   ##   #  #
    /**
     * Begins the process of linking a Discord user and a Twitch user.  Discord-only.
     * @param {string|User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    addtwitch(user, message) {
        const commands = this;

        return Commands.discordPromise((resolve, reject) => {
            if (!message) {
                resolve(false);
                return;
            }

            Twitch.getChannelStream(message).then((results) => {
                if (!results) {
                    commands.service.queue(`Sorry, ${user}, but ${message} is not a valid Twitch streamer.`);
                    reject(new Error("Twitch streamer does not exist."));
                    return;
                }

                Db.query(
                    "select discord, code, validated from streamer where streamer = @streamer",
                    {streamer: {type: Db.VARCHAR(50), value: message}}
                ).then((data) => {
                    const {id} = user;

                    if (data && data.recordsets[0] && data.recordsets[0][0]) {
                        if (data.recordsets[0][0].discord !== id) {
                            const users = Discord.findUserById(data.recordsets[0][0].discord);

                            if (users.length === 0) {
                                commands.service.queue(`Sorry, ${user}, but ${message} has already been registered.  If this is in error, get a hold of roncli for fixing.`);
                                reject(new Error("Twitch stream has already been registered by another user, and the user is no longer on the server."));
                            } else {
                                commands.service.queue(`Sorry, ${user}, but ${message} has already been registered by ${users[0]}.  If this is in error, get a hold of roncli for fixing.`);
                                reject(new Error("Twitch stream has already been registered by another user."));
                            }

                            return;
                        }

                        if (data.recordsets[0][0].validated) {
                            commands.service.queue(`Sorry, ${user}, but you're already validated!`);
                            reject(new Error("Twitch stream has already been added."));
                            return;
                        }

                        commands.service.queue(`${user}, to validate that this is you, please log in to Twitch as ${message}, visit http://twitch.tv/SixGamingGG, and enter the command \`!confirm ${data.recordsets[0][0].code}\` into chat.`);
                        resolve(true);
                        return;
                    }

                    const code = Math.floor(Math.random() * 900 + 100);

                    Db.query(
                        "insert into streamer (streamer, discord, code) values (@streamer, @discord, @code)",
                        {
                            streamer: {type: Db.VARCHAR(50), value: message},
                            discord: {type: Db.VARCHAR(50), value: id},
                            code: {type: Db.INT, value: code}
                        }
                    ).then(() => {
                        commands.service.queue(`${user}, to validate that this is you, please log in to Twitch as ${message}, visit http://twitch.tv/SixGamingGG, and enter the command \`!confirm ${code}\` into chat.`);
                        resolve(true);
                    }).catch((err) => {
                        commands.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
                        reject(new Exception("There was a database error inserting into the streamer table.", err));
                    });
                }).catch((err) => {
                    commands.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
                    reject(new Exception("There was a database error while checking to see if the user is a streamer.", err));
                });
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
                reject(new Exception("There was a Twitch API error while checking to see if the user is a streamer.", err));
            });
        });
    }

    //                                      #           #     #          #
    //                                      #                 #          #
    // ###    ##   # #    ##   # #    ##   ###   #  #  ##    ###    ##   ###
    // #  #  # ##  ####  #  #  # #   # ##   #    #  #   #     #    #     #  #
    // #     ##    #  #  #  #  # #   ##     #    ####   #     #    #     #  #
    // #      ##   #  #   ##    #     ##     ##  ####  ###     ##   ##   #  #
    /**
     * Removes the link between a Discord user and a Twitch user.  Discord-only.
     * @param {string|User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    removetwitch(user, message) {
        const commands = this;

        return Commands.discordPromise((resolve, reject) => {
            if (message) {
                resolve(false);
                return;
            }

            Db.query(
                "select id, streamer from streamer where discord = @discord",
                {discord: {type: Db.VARCHAR(50), value: user.id}}
            ).then((data) => {
                if (!data || !data.recordsets[0] || !data.recordsets[0][0]) {
                    commands.service.queue(`${user}, you are not currently registered as a streamer.`);
                    reject(new Error("User is not a streamer."));
                    return;
                }

                const {id, streamer} = data.recordsets[0][0];

                Db.query(
                    "delete from streamer where id = @id",
                    {id: {type: Db.INT, value: id}}
                ).then(() => {
                    const channel = Discord.findChannelByName(`twitch-${streamer}`);

                    if (channel) {
                        channel.delete();
                    }
                    Discord.removeStreamersRole(user);
                    Discord.removeStreamer(streamer);

                    commands.service.queue(`${user}, you have been removed as a streamer.`);
                    resolve(true);
                }).catch((err) => {
                    commands.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
                    reject(new Exception("There was a database error while removing a streamer.", err));
                });
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
                reject(new Exception("There was a database error while checking to see if the user is a streamer.", err));
            });
        });
    }

    //          #     #                    #                             ##
    //          #     #                    #                              #
    //  ###   ###   ###  # #   #  #   ##   ###    ###  ###   ###    ##    #
    // #  #  #  #  #  #  ####  #  #  #     #  #  #  #  #  #  #  #  # ##   #
    // # ##  #  #  #  #  #  #   # #  #     #  #  # ##  #  #  #  #  ##     #
    //  # #   ###   ###  #  #    #    ##   #  #   # #  #  #  #  #   ##   ###
    //                          #
    /**
     * Adds a Discord text channel for a Twitch user.  Discord-only.
     * @param {string|User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    addmychannel(user, message) {
        const commands = this;

        return Commands.discordPromise((resolve, reject) => {
            if (message) {
                commands.service.queue(`Sorry, ${user}, but that is not a valid command.  Did you mean to \`!addchannel <channel name>\` to create a voice channel?`);
                resolve(false);
                return;
            }

            Db.query(
                "select streamer from streamer where discord = @discord",
                {discord: {type: Db.VARCHAR(50), value: user.id}}
            ).then((data) => {
                if (!data || !data.recordsets[0] || !data.recordsets[0][0]) {
                    commands.service.queue(`Sorry, ${user}, but you are not currently registered as a streamer.  Use \`!addtwitch\` to add your channel.`);
                    reject(new Error("User is not a streamer."));
                    return;
                }

                const {streamer} = data.recordsets[0][0];

                Discord.createTextChannel(`twitch-${streamer}`).then((channel) => {
                    channel.setTopic(`This channel is for ${user}'s Twitch stream.  Follow ${user} on Twitch at http://twitch.tv/${streamer}.`).then(() => {
                        channel.setPosition(9999).then(() => {
                            Discord.sortDiscordChannels();
                            resolve(true);
                        }).catch((err) => {
                            reject(new Exception("There was a Discord error while setting the position of the channel.", err));
                        });

                        commands.service.queue(`${user}, your text channel has now been created at ${channel}.`);
                    }).catch((err) => {
                        commands.service.queue(`Sorry, ${user}, but there was a problem creating your channel.  Does it already exist?`);
                        reject(new Exception("There was a Discord error while setting the channel's topic.", err));
                    });
                }).catch((err) => {
                    commands.service.queue(`Sorry, ${user}, but there was a problem creating your channel.  Does it already exist?`);
                    reject(new Exception("There was a Discord error while creating a text channel.", err));
                });
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
                reject(new Exception("There was a database error while checking to see if the user is a streamer.", err));
            });
        });
    }

    //                                                       #                             ##
    //                                                       #                              #
    // ###    ##   # #    ##   # #    ##   # #   #  #   ##   ###    ###  ###   ###    ##    #
    // #  #  # ##  ####  #  #  # #   # ##  ####  #  #  #     #  #  #  #  #  #  #  #  # ##   #
    // #     ##    #  #  #  #  # #   ##    #  #   # #  #     #  #  # ##  #  #  #  #  ##     #
    // #      ##   #  #   ##    #     ##   #  #    #    ##   #  #   # #  #  #  #  #   ##   ###
    //                                            #
    /**
     * Removes a Discord channel for a Twitch user.  Discord-only.
     * @param {string|User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    removemychannel(user, message) {
        const commands = this;

        return Commands.discordPromise((resolve, reject) => {
            if (message) {
                resolve(false);
                return;
            }

            Db.query(
                "select streamer from streamer where discord = @discord",
                {discord: {type: Db.VARCHAR(50), value: user.id}}
            ).then((data) => {
                if (!data || !data.recordsets[0] || !data.recordsets[0][0]) {
                    commands.service.queue(`Sorry, ${user}, but you are not currently registered as a streamer.  Use \`!addtwitch\` to add your channel.`);
                    reject(new Error("User is not a streamer."));
                    return;
                }

                const {streamer} = data.recordsets[0][0],
                    channel = Discord.findChannelByName(`twitch-${streamer}`);

                if (channel) {
                    channel.delete();
                    commands.service.queue(`${user}, your text channel has been removed.  You can always recreate it using \`!addmychannel\`.`);
                    resolve(true);
                    return;
                }

                commands.service.queue(`Sorry, ${user}, but there was a problem removing your text channel.  Are you sure you have one?`);
                reject(new Error("Channel does not exist."));
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
                reject(new Exception("There was a database error while checking to see if the user is a streamer.", err));
            });
        });
    }

    //          #     #          #
    //          #     #          #
    //  ###   ###   ###   ###   ###   ###    ##    ###  # #    ##   ###
    // #  #  #  #  #  #  ##      #    #  #  # ##  #  #  ####  # ##  #  #
    // # ##  #  #  #  #    ##    #    #     ##    # ##  #  #  ##    #
    //  # #   ###   ###  ###      ##  #      ##    # #  #  #   ##   #
    /**
     * Adds a streamer to the auto hosting rotation.  Discord- and admin-only.
     * @param {string|User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    addstreamer(user, message) {
        const commands = this;

        return Commands.discordPromise().then(() => Commands.adminPromise(user, (resolve, reject) => {
            Twitch.getChannelStream(message).then((results) => {
                if (!results) {
                    commands.service.queue(`Sorry, ${user}, but ${message} is not a valid Twitch streamer.`);
                    reject(new Error("Invalid Twitch streamer name."));
                    return;
                }

                Db.query(
                    "select streamer from host where streamer = @streamer",
                    {streamer: {type: Db.VARCHAR(50), value: message}}
                ).then((data) => {
                    if (data && data.recordsets[0] && data.recordsets[0][0]) {
                        commands.service.queue(`Sorry, ${user}, but ${message} has already been added as a streamer to be hosted.`);
                        reject(new Error("Streamer is already a hosted streamer."));
                        return;
                    }

                    Db.query(
                        "insert into host (streamer) values (@streamer)",
                        {streamer: {type: Db.VARCHAR(50), value: message}}
                    ).then(() => {
                        Discord.addHost(message.toLowerCase());
                        commands.service.queue(`${user}, you have successfully added ${message} as a streamer to be hosted.`);
                        resolve(true);
                    }).catch((err) => {
                        commands.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
                        reject(new Exception("There was a database error while adding a hosted streamer.", err));
                    });
                }).catch((err) => {
                    commands.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
                    reject(new Exception("There was a database error while checking if the streamer is a hosted streamer.", err));
                });
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
                reject(new Exception("There was a Twitch API error while checking if the streamer exists.", err));
            });
        }));
    }

    //                                             #
    //                                             #
    // ###    ##   # #    ##   # #    ##    ###   ###   ###    ##    ###  # #    ##   ###
    // #  #  # ##  ####  #  #  # #   # ##  ##      #    #  #  # ##  #  #  ####  # ##  #  #
    // #     ##    #  #  #  #  # #   ##      ##    #    #     ##    # ##  #  #  ##    #
    // #      ##   #  #   ##    #     ##   ###      ##  #      ##    # #  #  #   ##   #
    /**
     * Removes a streamer from the auto hosting rotation.  Discord- and admin-only.
     * @param {string|User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    removestreamer(user, message) {
        const commands = this;

        return Commands.discordPromise().then(() => Commands.adminPromise(user, (resolve, reject) => {
            if (!message) {
                resolve(false);
                return;
            }

            Db.query(
                "select id from host where streamer = @streamer",
                {streamer: {type: Db.VARCHAR(50), value: message}}
            ).then((data) => {
                if (!data || !data.recordsets[0] || !data.recordsets[0][0]) {
                    commands.service.queue(`Sorry, ${user}, but ${message} is not currently a hosted streamer.`);
                    reject(new Error("Stremaer is not a hosted streamer."));
                    return;
                }

                const {id} = data.recordsets[0][0];

                Db.query(
                    "delete from host where id = @id",
                    {id: {type: Db.INT, value: id}}
                ).then(() => {
                    Discord.removeHost(message);
                    commands.service.queue(`${user}, ${message} has been removed as a hosted streamer.`);
                    resolve(true);
                }).catch((err) => {
                    commands.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
                    reject(new Exception("There was a database error while removing a hosted streamer.", err));
                });
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
                reject(new Exception("There was a database error while checking if the streamer is a hosted streamer.", err));
            });
        }));
    }

    //          #     #        #                             ##
    //          #     #        #                              #
    //  ###   ###   ###   ##   ###    ###  ###   ###    ##    #
    // #  #  #  #  #  #  #     #  #  #  #  #  #  #  #  # ##   #
    // # ##  #  #  #  #  #     #  #  # ##  #  #  #  #  ##     #
    //  # #   ###   ###   ##   #  #   # #  #  #  #  #   ##   ###
    /**
     * Adds a voice channel to Discord.  Discord-only.
     * @param {string|User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    addchannel(user, message) {
        const commands = this;

        return Commands.discordPromise().then((resolve, reject) => {
            if (!message) {
                commands.service.queue(`Sorry, ${user}, but that is not a valid command.  Did you mean to \`!addmychannel\` to create your own text channel for your Twitch community?`);
                resolve(false);
                return;
            }

            if (userCreatedChannels[user.id]) {
                commands.service.queue(`Sorry, ${user}, but you can only create a voice channel once every five minutes.`);
                reject(new Error("Can only create a voice channel once every 5 minutes."));
                return;
            }

            if (Discord.findChannelByName(message)) {
                commands.service.queue(`Sorry, ${user}, but ${message} already exists as a voice channel.`);
                reject(new Error("Channel already exists."));
                return;
            }

            Discord.createVoiceChannel(message).then((channel) => {
                if (channel.members.size === 0) {
                    Discord.markEmptyVoiceChannel(channel);
                }

                userCreatedChannels[user.id] = setTimeout(() => {
                    delete userCreatedChannels[user.id];
                }, 300000);

                commands.service.queue(`${user}, the voice channel ${message} has been created.  It will be automatically deleted after being empty for 5 minutes.`);
                resolve(true);
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
                reject(new Exception("There was a Discord error while attempting to create a voice channel.", err));
            });
        });
    }

    //          #     #
    //          #     #
    //  ###   ###   ###   ###   ###  # #    ##
    // #  #  #  #  #  #  #  #  #  #  ####  # ##
    // # ##  #  #  #  #   ##   # ##  #  #  ##
    //  # #   ###   ###  #      # #  #  #   ##
    //                    ###
    /**
     * Adds a game for notifications.  Discord- and admin-only.
     * @param {string|User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    addgame(user, message) {
        const commands = this;

        return Commands.discordPromise().then(() => Commands.adminPromise(user, (resolve, reject) => {
            const matches = addGameParse.exec(message);

            if (!matches) {
                resolve(false);
                return;
            }

            const short = matches[1].toLowerCase(),
                game = matches[2];

            if (Discord.findRoleByName(short)) {
                commands.service.queue(`Sorry, ${user}, but the role for game ${short} has already been created.`);
                reject(new Error("Game has already been added."));
                return;
            }

            Db.query(
                "insert into game (game, code) values (@game, @code)",
                {
                    game: {type: Db.VARCHAR(255), value: game},
                    code: {type: Db.VARCHAR(50), value: short}
                }
            ).then(() => {
                Discord.createRole({
                    name: short,
                    color: 0xFF0000,
                    hoist: false,
                    mentionable: true
                }).then((role) => {
                    Discord.addUserToRole(user, role).then(() => {
                        commands.service.queue(`${user}, ${role} has been setup as a mentionable role with you as the first member!  You may also discuss the game in #games.  Anyone may join this role to be notified by entering \`!notify ${short}\`.`);
                        resolve(true);
                    }).catch((err) => {
                        commands.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
                        reject(new Exception("There was a Discord error while adding the user to the new role.", err));
                    });
                }).catch((err) => {
                    commands.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
                    reject(new Exception("There was a Discord error while creating the game's role.", err));
                });
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
                reject(new Exception("There was a database error while adding the game to the table.", err));
            });
        }));
    }

    // ###    ##   # #    ##   # #    ##    ###   ###  # #    ##
    // #  #  # ##  ####  #  #  # #   # ##  #  #  #  #  ####  # ##
    // #     ##    #  #  #  #  # #   ##     ##   # ##  #  #  ##
    // #      ##   #  #   ##    #     ##   #      # #  #  #   ##
    //                                      ###
    /**
     * Removes a game from notifications.  Discord- and owner-only.
     * @param {string|User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    removegame(user, message) {
        const commands = this;

        return Commands.discordPromise().then(() => Commands.ownerPromise(user, (resolve, reject) => {
            if (!message) {
                resolve(false);
                return;
            }

            message = message.toLowerCase();

            const role = Discord.findRoleByName(message);

            if (role) {
                commands.service.queue(`Sorry, ${user}, but the game ${message} does not exist.`);
                reject(new Error("Game does not exist."));
                return;
            }

            role.delete();

            Db.query(
                "delete from game where code = @code", {code: {type: Db.VARCHAR(50), value: message}}
            ).then(() => {
                commands.service.queue(`${user}, the game ${message} has been removed.`);
                resolve(true);
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
                reject(new Exception("There was a database error while removing a game from the table.", err));
            });
        }));
    }

    //  ###   ###  # #    ##    ###
    // #  #  #  #  ####  # ##  ##
    //  ##   # ##  #  #  ##      ##
    // #      # #  #  #   ##   ###
    //  ###
    /**
     * Whispers a list of games to be notified for to a user.  Discord-only.
     * @param {string|User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    games(user, message) {
        const commands = this;

        return Commands.discordPromise().then((resolve, reject) => {
            if (message) {
                resolve(false);
                return;
            }

            Db.query("select game, code from game order by code").then((data) => {
                let response = "You may use `!notify <game>` for the following games:";

                if (!data || !data.recordsets[0] || data.recordsets[0].length === 0) {
                    commands.service.queue(`Sorry, ${user}, but there are no games to be notified for.`);
                    reject(new Error("There are no games to be notified for."));
                    return;
                }

                data.recordsets[0].forEach((row) => {
                    response += `\n\`${row.code}\` - ${row.game}`;
                });

                commands.service.queue(response, user);
                resolve(true);
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
                reject(new Exception("There was a database error while retrieving the games list.", err));
            });
        });
    }

    //              #     #      #
    //              #           # #
    // ###    ##   ###   ##     #    #  #
    // #  #  #  #   #     #    ###   #  #
    // #  #  #  #   #     #     #     # #
    // #  #   ##     ##  ###    #      #
    //                                #
    /**
     * Sets up a user to be notified for a game.  Discord-only.
     * @param {string|User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    notify(user, message) {
        const commands = this;

        return Commands.discordPromise().then((resolve, reject) => {
            if (!message) {
                resolve(false);
                return;
            }

            message = message.toLowerCase();

            const role = Discord.findRoleByName(message);

            if (!role) {
                commands.service.queue(`Sorry, ${user}, but the game ${message} does not exist.`);
                reject(new Error("Game does not exist."));
                return;
            }

            Discord.addUserToRole(user, role).then(() => {
                commands.service.queue(`${user}, you have been setup to be notified whenever ${role.name} is mentioned!`);
                resolve(true);
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
                reject(new Exception("There was a Discord error while attempting to add the user to the role.", err));
            });
        });
    }

    //                          #     #      #
    //                          #           # #
    // #  #  ###   ###    ##   ###   ##     #    #  #
    // #  #  #  #  #  #  #  #   #     #    ###   #  #
    // #  #  #  #  #  #  #  #   #     #     #     # #
    //  ###  #  #  #  #   ##     ##  ###    #      #
    //                                            #
    /**
     * Stops notifications for a game for a user.  Discord-only.
     * @param {string|User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    unnotify(user, message) {
        const commands = this;

        return Commands.discordPromise().then((resolve, reject) => {
            if (!message) {
                resolve(false);
                return;
            }

            message = message.toLowerCase();

            const role = Discord.findRoleByName(message);

            if (!role) {
                commands.service.queue(`Sorry, ${user}, but the game ${message} does not exist.`);
                reject(new Error("Game does not exist."));
                return;
            }

            Discord.removeUserFromRole(user, role).then(() => {
                commands.service.queue(`${user}, you have been setup to no longer be notified whenever ${role.name} is mentioned!`);
                resolve(true);
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
                reject(new Exception("There was a Discord error while attempting to remove the user from the role.", err));
            });
        });
    }

    //         #                                         #     #      #
    //         #                                         #           # #
    //  ###   ###   ###    ##    ###  # #   ###    ##   ###   ##     #    #  #
    // ##      #    #  #  # ##  #  #  ####  #  #  #  #   #     #    ###   #  #
    //   ##    #    #     ##    # ##  #  #  #  #  #  #   #     #     #     # #
    // ###      ##  #      ##    # #  #  #  #  #   ##     ##  ###    #      #
    //                                                                     #
    /**
     * Sets up a user to be notified for streams.  Discord-only.
     * @param {string|User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    streamnotify(user, message) {
        const commands = this;

        return Commands.discordPromise().then((resolve, reject) => {
            if (message) {
                resolve(false);
                return;
            }

            Discord.addStreamNotifyRole(user).then(() => {
                commands.service.queue(`${user}, you have been setup to be notified when Six Gaming or one of its members is live on Twitch!`);
                resolve(true);
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but there was a problem with setting you up for being notified when Six Gaming or one of its members is live on Twitch.  Are you sure you're not already setup to be notified?`);
                reject(new Exception("There was a Discord error while attempting to add the user to the role.", err));
            });
        });
    }

    //         #                                                     #     #      #
    //         #                                                     #           # #
    //  ###   ###   ###    ##    ###  # #   #  #  ###   ###    ##   ###   ##     #    #  #
    // ##      #    #  #  # ##  #  #  ####  #  #  #  #  #  #  #  #   #     #    ###   #  #
    //   ##    #    #     ##    # ##  #  #  #  #  #  #  #  #  #  #   #     #     #     # #
    // ###      ##  #      ##    # #  #  #   ###  #  #  #  #   ##     ##  ###    #      #
    //                                                                                 #
    /**
     * Stops notifications for streams for a user.  Discord-only.
     * @param {string|User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    streamunnotify(user, message) {
        const commands = this;

        return Commands.discordPromise().then((resolve, reject) => {
            if (message) {
                resolve(false);
                return;
            }

            Discord.removeStreamNotifyRole(user).then(() => {
                commands.service.queue(`${user}, you have been setup to be no longer be notified when Six Gaming or one of its members is live on Twitch.`);
                resolve(true);
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but there was a problem with setting you up to not be notified when Six Gaming or one of its members is live on Twitch.  Are you sure you were setup to be notified?`);
                reject(new Exception("There was a Discord error while attempting to remove the user from the role.", err));
            });
        });
    }

    //                      #                           #
    //                      #
    // ###    ###  ###    ###   ##   # #    ##   ###   ##    #  #  # #
    // #  #  #  #  #  #  #  #  #  #  ####  #  #  #  #   #    #  #  ####
    // #     # ##  #  #  #  #  #  #  #  #  #  #  #  #   #    #  #  #  #
    // #      # #  #  #   ###   ##   #  #   ##   #  #  ###    ###  #  #
    /**
     * Assigns a random Overwatch hero to everyone in the user's voice channel.  Discord-only.
     * @param {string|User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    randomonium(user, message) {
        const commands = this;

        return Commands.discordPromise().then((resolve, reject) => {
            const voiceChannel = Discord.getUserVoiceChannel(user);

            if (!voiceChannel) {
                commands.service.queue(`Sorry, ${user}, but you must be in a voice channel to use this command.`);
                reject(new Error("User was not in a voice channel."));
                return;
            }

            const heroes = randomonium.getHeroes(voiceChannel.members.length, message === "dupe" || message === "dupes");

            voiceChannel.members.forEach((member, index) => {
                if (voiceChannel && member.voiceChannel && voiceChannel.id === member.voiceChannel.id) {
                    commands.service.queue(`${member}: ${heroes[index]}`);
                }
            });

            resolve(true);
        });
    }
}

module.exports = Commands;
