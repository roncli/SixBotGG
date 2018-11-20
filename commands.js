const Db = require("./database"),
    Exception = require("./exception"),
    pjson = require("./package.json"),
    randomonium = require("./randomonium"),
    Twitch = require("./twitch"),

    addGameParse = /^([a-zA-Z0-9]{2,50}) +(.{2,255})$/,
    userCreatedChannels = {};

/**
 * @type {typeof import("./discord")}
 */
let Discord;

/**
 * @type {typeof import("./tmi")}
 */
let Tmi;

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

        if (!Discord) {
            Discord = require("./discord");
        }

        if (!Tmi) {
            Tmi = require("./tmi");
        }
    }

    //          #         #           ##   #                 #
    //          #                    #  #  #                 #
    //  ###   ###  # #   ##    ###   #     ###    ##    ##   # #
    // #  #  #  #  ####   #    #  #  #     #  #  # ##  #     ##
    // # ##  #  #  #  #   #    #  #  #  #  #  #  ##    #     # #
    //  # #   ###  #  #  ###   #  #   ##   #  #   ##    ##   #  #
    /**
     * Throws an error if the user is not an admin.
     * @param {Commands} commands The commands object.
     * @param {string|User} user The user to check.
     * @returns {void}
     */
    static adminCheck(commands, user) {
        if (!(commands.service.name === "Discord" && Discord.isPodcaster(user) || commands.service.name === "Tmi" && Tmi.isMod(user))) {
            throw new Error("Admin permission required to perform this command.");
        }
    }

    //          #         #          ###                      #
    //          #                    #  #
    //  ###   ###  # #   ##    ###   #  #  ###    ##   # #   ##     ###    ##
    // #  #  #  #  ####   #    #  #  ###   #  #  #  #  ####   #    ##     # ##
    // # ##  #  #  #  #   #    #  #  #     #     #  #  #  #   #      ##   ##
    //  # #   ###  #  #  ###   #  #  #     #      ##   #  #  ###   ###     ##
    /**
     * A promise that only proceeds if the user is an admin.
     * @param {Commands} commands The commands object.
     * @param {string|User} user The user to check.
     * @param {function} fx The function to run with the promise.
     * @returns {Promise} A promise that resolves if the user is an admin.
     */
    static adminPromise(commands, user, fx) {
        return new Promise((resolve, reject) => {
            if (!(commands.service.name === "Discord" && Discord.isPodcaster(user) || commands.service.name === "Tmi" && Tmi.isMod(user))) {
                reject(new Error("Admin permission required to perform this command."));
                return;
            }

            if (fx) {
                new Promise(fx).then(resolve).catch(reject);
            } else {
                resolve();
            }
        });
    }

    //    #   #                                #  ###                      #
    //    #                                    #  #  #
    //  ###  ##     ###    ##    ##   ###    ###  #  #  ###    ##   # #   ##     ###    ##
    // #  #   #    ##     #     #  #  #  #  #  #  ###   #  #  #  #  ####   #    ##     # ##
    // #  #   #      ##   #     #  #  #     #  #  #     #     #  #  #  #   #      ##   ##
    //  ###  ###   ###     ##    ##   #      ###  #     #      ##   #  #  ###   ###     ##
    /**
     * A promise that only proceeds if the user is on Discord.
     * @param {Commands} commands The commands object.
     * @param {function} fx The function to run with the promise.
     * @returns {Promise} A promise that resolves if the user is on Discord.
     */
    static discordPromise(commands, fx) {
        return new Promise((resolve, reject) => {
            if (commands.service.name !== "Discord") {
                reject(new Error("This command is for Discord only."));
                return;
            }

            if (fx) {
                new Promise(fx).then(resolve).catch(reject);
            } else {
                resolve();
            }
        });
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

            if (fx) {
                new Promise(fx).then(resolve).catch(reject);
            } else {
                resolve();
            }
        });
    }

    //  #           #    ###                      #
    //  #                #  #
    // ###   # #   ##    #  #  ###    ##   # #   ##     ###    ##
    //  #    ####   #    ###   #  #  #  #  ####   #    ##     # ##
    //  #    #  #   #    #     #     #  #  #  #   #      ##   ##
    //   ##  #  #  ###   #     #      ##   #  #  ###   ###     ##
    /**
     * A promise that only proceeds if the user is on tmi.
     * @param {Commands} commands The commands object.
     * @param {function} fx The function to run with the promise
     * @returns {Promise} A promise that resolves if the user is on tmi.
     */
    static tmiPromise(commands, fx) {
        return new Promise((resolve, reject) => {
            if (commands.service.name !== "Tmi") {
                reject(new Error("This command is for Twitch chat only."));
                return;
            }

            if (fx) {
                new Promise(fx).then(resolve).catch(reject);
            } else {
                resolve();
            }
        });
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

        return Commands.tmiPromise(commands, (resolve) => {
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

        return Commands.tmiPromise(commands, (resolve) => {
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

        return Commands.tmiPromise(commands, (resolve) => {
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

        return Commands.tmiPromise(commands, (resolve) => {
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

        return Commands.tmiPromise(commands, (resolve) => {
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

        return Commands.tmiPromise(commands, (resolve) => {
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

        return Commands.adminPromise(commands, user, (resolve, reject) => {
            if (!message) {
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

            message = message.toLowerCase();

            if (Discord.currentHost === message) {
                commands.service.queue(`Sorry, ${user}, but I am already hosting ${message}.`);
                reject(new Error("Cannot host the currently hosted channel."));
                return;
            }

            Twitch.getChannelStream(message).then((results) => {
                Discord.manualHosting = results && results.stream;

                if (Discord.manualHosting) {
                    Tmi.host("sixgaminggg", message).then(() => {
                        Discord.currentHost = message;

                        Tmi.queue(`Now hosting ${Discord.currentHost}.  Check out their stream at http://twitch.tv/${Discord.currentHost}!`);
                        Discord.announceStream(results.stream);
                        resolve(true);
                    }).catch((err) => {
                        if (err === "bad_host_hosting") {
                            commands.service.queue(`Sorry, ${user}, but I am already hosting ${message}.`);
                            reject(new Error("Cannot host the currently hosted channel."));
                            return;
                        }

                        if (err === "bad_host_error") {
                            commands.service.queue(`Sorry, ${user}, but Twitch is having issues.  Try hosting again later.`);
                            reject(new Error("Twitch error while attempting to host."));
                            return;
                        }

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

        return Commands.adminPromise(commands, user, (resolve, reject) => {
            if (message) {
                resolve(false);
                return;
            }

            if (!Discord.currentHost) {
                commands.service.queue(`Sorry, ${user}, but you can't stop hosting when the channel isn't hosting anyone.`);
                reject(new Error("Not currently hosting a channel."));
                return;
            }

            Tmi.unhost("sixgaminggg").catch(() => {});
            commands.service.queue("Exiting host mode.");
            Discord.manualHosting = false;
            Discord.currentHost = "";
            resolve(true);
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

        return Commands.discordPromise(commands, (resolve, reject) => {
            if (message) {
                commands.service.queue(`Sorry, ${user}, but that is not a valid command.  Did you mean to \`!addchannel <channel name>\` to create a voice channel?`);
                resolve(false);
                return;
            }

            Db.getStreamerByDiscord(user.id).then((streamer) => {
                if (!streamer) {
                    commands.service.queue(`Sorry, ${user}, but you are not currently registered as a streamer.  Use \`!addtwitch\` to add your channel.`);
                    reject(new Error("User is not a streamer."));
                    return;
                }

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

        return Commands.discordPromise(commands, (resolve, reject) => {
            if (message) {
                resolve(false);
                return;
            }

            Db.getStreamerByDiscord(user.id).then((streamer) => {
                if (!streamer) {
                    commands.service.queue(`Sorry, ${user}, but you are not currently registered as a streamer.  Use \`!addtwitch\` to add your channel.`);
                    reject(new Error("User is not a streamer."));
                    return;
                }

                const channel = Discord.findChannelByName(`twitch-${streamer}`);

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

        return Commands.discordPromise(commands).then(() => Commands.adminPromise(commands, user, (resolve, reject) => {
            Twitch.getChannelStream(message).then((results) => {
                if (!results) {
                    commands.service.queue(`Sorry, ${user}, but ${message} is not a valid Twitch streamer.`);
                    reject(new Error("Invalid Twitch streamer name."));
                    return;
                }

                Db.hostExistsByName(message).then((exists) => {
                    if (exists) {
                        commands.service.queue(`Sorry, ${user}, but ${message} has already been added as a streamer to be hosted.`);
                        reject(new Error("Streamer is already a hosted streamer."));
                        return;
                    }

                    Db.addHost(message).then(() => {
                        Discord.addHost(message);
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

        return Commands.discordPromise(commands).then(() => Commands.adminPromise(commands, user, (resolve, reject) => {
            if (!message) {
                resolve(false);
                return;
            }

            Db.getHostIdByName(message).then((id) => {
                if (!id) {
                    commands.service.queue(`Sorry, ${user}, but ${message} is not currently a hosted streamer.`);
                    reject(new Error("Stremaer is not a hosted streamer."));
                    return;
                }

                Db.deleteHostById(id).then(() => {
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

        return Commands.discordPromise(commands, (resolve, reject) => {
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

        return Commands.discordPromise(commands).then(() => Commands.adminPromise(commands, user, (resolve, reject) => {
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

            Db.addGame(game, short).then(() => {
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

        return Commands.discordPromise(commands).then(() => Commands.ownerPromise(user, (resolve, reject) => {
            if (!message) {
                resolve(false);
                return;
            }

            message = message.toLowerCase();

            const role = Discord.findRoleByName(message);

            if (role) {
                role.delete();
            }

            Db.deleteGameByCode(message).then(() => {
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

        return Commands.discordPromise(commands, (resolve, reject) => {
            if (message) {
                resolve(false);
                return;
            }

            Db.getGames().then((games) => {
                if (!games || games.length === 0) {
                    commands.service.queue(`Sorry, ${user}, but there are no games to be notified for.`);
                    reject(new Error("There are no games to be notified for."));
                    return;
                }

                let response = "You may use `!notify <game>` for the following games:";

                games.forEach((row) => {
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

        return Commands.discordPromise(commands, (resolve, reject) => {
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

        return Commands.discordPromise(commands, (resolve, reject) => {
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

        return Commands.discordPromise(commands, (resolve, reject) => {
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

        return Commands.discordPromise(commands, (resolve, reject) => {
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

        return Commands.discordPromise(commands, (resolve, reject) => {
            const voiceChannel = Discord.getUserVoiceChannel(user);

            if (!voiceChannel) {
                commands.service.queue(`Sorry, ${user}, but you must be in a voice channel to use this command.`);
                reject(new Error("User was not in a voice channel."));
                return;
            }

            const heroes = randomonium.getHeroes(voiceChannel.members.size, message === "dupe" || message === "dupes");

            let index = 0;

            voiceChannel.members.forEach((member) => {
                if (voiceChannel && member.voiceChannel && voiceChannel.id === member.voiceChannel.id) {
                    commands.service.queue(`${member}: ${heroes[index]}`);
                }
                index++;
            });

            resolve(true);
        });
    }
}

module.exports = Commands;
