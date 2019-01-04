/**
 * @typedef {import("discord.js").GuildMember} DiscordJs.GuildMember
 * @typedef {import("./user")} User
 */

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
     * @param {typeof Discord|typeof Tmi} service The service to use with the commands.
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

    //       #                 #     #  #                     ###           ##      #         #
    //       #                 #     #  #                      #           #  #     #
    //  ##   ###    ##    ##   # #   #  #   ###    ##   ###    #     ###   #  #   ###  # #   ##    ###
    // #     #  #  # ##  #     ##    #  #  ##     # ##  #  #   #    ##     ####  #  #  ####   #    #  #
    // #     #  #  ##    #     # #   #  #    ##   ##    #      #      ##   #  #  #  #  #  #   #    #  #
    //  ##   #  #   ##    ##   #  #   ##   ###     ##   #     ###   ###    #  #   ###  #  #  ###   #  #
    /**
     * Checks that the user is an admin.
     * @param {typeof Discord|typeof Tmi} service The service.
     * @param {User} user The user to check.
     * @returns {void}
     */
    static checkUserIsAdmin(service, user) {
        if (!(service.name === Discord.name && Discord.isPodcaster(user.discord) || service.name === Tmi.name && Tmi.isMod(user.tmi))) {
            throw new Error("Admin permission required to perform this command.");
        }
    }

    //       #                 #     #  #                                        ###          ####                    ###    #                                #
    //       #                 #     ####                                         #           #                       #  #                                    #
    //  ##   ###    ##    ##   # #   ####   ##    ###    ###    ###   ###   ##    #     ###   ###   ###    ##   # #   #  #  ##     ###    ##    ##   ###    ###
    // #     #  #  # ##  #     ##    #  #  # ##  ##     ##     #  #  #  #  # ##   #    ##     #     #  #  #  #  ####  #  #   #    ##     #     #  #  #  #  #  #
    // #     #  #  ##    #     # #   #  #  ##      ##     ##   # ##   ##   ##     #      ##   #     #     #  #  #  #  #  #   #      ##   #     #  #  #     #  #
    //  ##   #  #   ##    ##   #  #  #  #   ##   ###    ###     # #  #      ##   ###   ###    #     #      ##   #  #  ###   ###   ###     ##    ##   #      ###
    //                                                                ###
    /**
     * Checks that the message is from Discord.
     * @param {typeof Discord|typeof Tmi} service The service.
     * @returns {void}
     */
    static checkMessageIsFromDiscord(service) {
        if (service.name !== Discord.name) {
            throw new Error("This command is for Discord only.");
        }
    }

    //       #                 #     #  #                     ###           ##
    //       #                 #     #  #                      #           #  #
    //  ##   ###    ##    ##   # #   #  #   ###    ##   ###    #     ###   #  #  #  #  ###    ##   ###
    // #     #  #  # ##  #     ##    #  #  ##     # ##  #  #   #    ##     #  #  #  #  #  #  # ##  #  #
    // #     #  #  ##    #     # #   #  #    ##   ##    #      #      ##   #  #  ####  #  #  ##    #
    //  ##   #  #   ##    ##   #  #   ##   ###     ##   #     ###   ###     ##   ####  #  #   ##   #
    /**
     * A promise that only proceeds if the user is the owner.
     * @param {User} user The user to check.
     * @returns {void}
     */
    static checkUserIsOwner(user) {
        if (!user.discord || !Discord.isOwner(user.discord)) {
            throw new Error("Owner permission required to perform this command.");
        }
    }

    //       #                 #     #  #                                        ###          ####                    ###          #
    //       #                 #     ####                                         #           #                        #
    //  ##   ###    ##    ##   # #   ####   ##    ###    ###    ###   ###   ##    #     ###   ###   ###    ##   # #    #    # #   ##
    // #     #  #  # ##  #     ##    #  #  # ##  ##     ##     #  #  #  #  # ##   #    ##     #     #  #  #  #  ####   #    ####   #
    // #     #  #  ##    #     # #   #  #  ##      ##     ##   # ##   ##   ##     #      ##   #     #     #  #  #  #   #    #  #   #
    //  ##   #  #   ##    ##   #  #  #  #   ##   ###    ###     # #  #      ##   ###   ###    #     #      ##   #  #   #    #  #  ###
    //                                                                ###
    /**
     * A promise that only proceeds if the user is on tmi.
     * @param {typeof Discord|typeof Tmi} service The service.
     * @returns {void}
     */
    static checkMessageIsFromTmi(service) {
        if (service.name !== Tmi.name) {
            throw new Error("This command is for Twitch chat only.");
        }
    }

    //   #                     #                 #
    //  # #                    #                 #
    //  #     ###   ##    ##   ###    ##    ##   # #
    // ###   #  #  #     # ##  #  #  #  #  #  #  ##
    //  #    # ##  #     ##    #  #  #  #  #  #  # #
    //  #     # #   ##    ##   ###    ##    ##   #  #
    /**
     * Replies with Six Gaming's Facebook URL.  Tmi-only.
     * @param {User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async facebook(user, message) {
        Commands.checkMessageIsFromTmi(this.service);

        if (message) {
            return false;
        }

        await this.service.queue("Check out Six Gaming on Facebook at http://fb.me/SixGamingGG");
        Tmi.rotateCommand("facebook");

        return true;
    }

    //  #           #     #     #
    //  #                 #     #
    // ###   #  #  ##    ###   ###    ##   ###
    //  #    #  #   #     #     #    # ##  #  #
    //  #    ####   #     #     #    ##    #
    //   ##  ####  ###     ##    ##   ##   #
    /**
     * Replies with Six Gaming's Twitter URL.  Tmi-only.
     * @param {User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async twitter(user, message) {
        Commands.checkMessageIsFromTmi(this.service);

        if (message) {
            return false;
        }

        await this.service.queue("Follow Six Gaming on Twitter at http://twitter.com/SixGamingGG");
        Tmi.rotateCommand("twitter");

        return true;
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
     * @param {User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async youtube(user, message) {
        Commands.checkMessageIsFromTmi(this.service);

        if (message) {
            return false;
        }

        await this.service.queue("Visit Six Gaming's YouTube page for a complete archive of our podcast at http://ronc.li/six-youtube");
        Tmi.rotateCommand("youtube");

        return true;
    }

    //  #     #
    //        #
    // ##    ###   #  #  ###    ##    ###
    //  #     #    #  #  #  #  # ##  ##
    //  #     #    #  #  #  #  ##      ##
    // ###     ##   ###  #  #   ##   ###
    /**
     * Replies with Six Gaming's iTunes URL.  Tmi-only.
     * @param {User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async itunes(user, message) {
        Commands.checkMessageIsFromTmi(this.service);

        if (message) {
            return false;
        }

        await this.service.queue("Subscribe to Six Gaming's video podcast on iTunes at http://ronc.li/six-itunes");
        Tmi.rotateCommand("itunes");

        return true;
    }

    //    #   #                                #
    //    #                                    #
    //  ###  ##     ###    ##    ##   ###    ###
    // #  #   #    ##     #     #  #  #  #  #  #
    // #  #   #      ##   #     #  #  #     #  #
    //  ###  ###   ###     ##    ##   #      ###
    /**
     * Replies with Six Gaming's Discord URL.  Tmi-only.
     * @param {User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async discord(user, message) {
        Commands.checkMessageIsFromTmi(this.service);

        if (message) {
            return false;
        }

        await this.service.queue("Join the Six Gaming Discord server for all the memes!  We are a community of gamers that enjoy playing together.  Join at http://ronc.li/six-discord");
        Tmi.rotateCommand("discord");

        return true;
    }

    //             #             #     #
    //             #                   #
    // #  #   ##   ###    ###   ##    ###    ##
    // #  #  # ##  #  #  ##      #     #    # ##
    // ####  ##    #  #    ##    #     #    ##
    // ####   ##   ###   ###    ###     ##   ##
    /**
     * Replies with Six Gaming's Website URL.  Tmi-only.
     * @param {User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async website(user, message) {
        Commands.checkMessageIsFromTmi(this.service);

        if (message) {
            return false;
        }

        await this.service.queue("We have a website?  Yes, we do!  Visit us at http://six.gg for everything Six Gaming!");
        Tmi.rotateCommand("website");

        return true;
    }

    //                           #
    //
    // # #    ##   ###    ###   ##     ##   ###
    // # #   # ##  #  #  ##      #    #  #  #  #
    // # #   ##    #       ##    #    #  #  #  #
    //  #     ##   #     ###    ###    ##   #  #
    /**
     * Replies with the current version of the bot.
     * @param {User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async version(user, message) {
        if (message) {
            return false;
        }

        await this.service.queue(`SixBotGG by roncli, Version ${pjson.version}`);

        return true;
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
     * @param {User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async help(user, message) {
        if (message) {
            return false;
        }

        await this.service.queue(`${user}, see the documentation at http://six.gg/about.`);

        return true;
    }

    // #                   #
    // #                   #
    // ###    ##    ###   ###
    // #  #  #  #  ##      #
    // #  #  #  #    ##    #
    // #  #   ##   ###      ##
    /**
     * Hosts a channel.  Admin-only.
     * @param {User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async host(user, message) {
        Commands.checkUserIsAdmin(this.service, user);

        if (!message) {
            return false;
        }

        if (Discord.isSixGamingLive()) {
            await this.service.queue(`Sorry, ${user}, but Six Gaming is live right now!`);
            throw new Error("Cannot host a channel while Six Gaming is live.");
        }

        if (Discord.canHost()) {
            await this.service.queue(`Sorry, ${user}, but I can only host 3 times within 30 minutes.`);
            throw new Error("Cannot host a channel when 3 channels have been hosted in the past 30 minutes.");
        }

        message = message.toLowerCase();

        if (Discord.currentHost === message) {
            await this.service.queue(`Sorry, ${user}, but I am already hosting ${message}.`);
            throw new Error("Cannot host the currently hosted channel.");
        }

        let results;
        try {
            results = await Twitch.getChannelStream(message);
        } catch (err) {
            await this.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
            throw new Exception("There was a Twitch API error while getting stream data.", err);
        }

        Discord.manualHosting = results && results.stream;

        if (Discord.manualHosting) {
            try {
                await Tmi.host("sixgaminggg", message);
            } catch (err) {
                if (err === "bad_host_hosting") {
                    await this.service.queue(`Sorry, ${user}, but I am already hosting ${message}.`);
                    throw new Error("Cannot host the currently hosted channel.");
                }

                if (err === "bad_host_error") {
                    await this.service.queue(`Sorry, ${user}, but Twitch is having issues.  Try hosting again later.`);
                    throw new Error("Twitch error while attempting to host.");
                }

                await this.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
                throw new Exception("There was a Twitch chat error while attempting to host a channel.", err);
            }

            Discord.currentHost = message;

            await Tmi.queue(`Now hosting ${Discord.currentHost}.  Check out their stream at http://twitch.tv/${Discord.currentHost}!`);
            Discord.announceStream(results.stream);

            return true;
        }

        if (results) {
            await this.service.queue(`Sorry, ${user}, but ${message} is not live right now.`);
            throw new Error("Cannot host a channel that is not live.");
        } else {
            await this.service.queue(`Sorry, ${user}, but ${message} is not a valid Twitch streamer.`);
            throw new Error("Channel does not exist.");
        }
    }

    //             #                   #
    //             #                   #
    // #  #  ###   ###    ##    ###   ###
    // #  #  #  #  #  #  #  #  ##      #
    // #  #  #  #  #  #  #  #    ##    #
    //  ###  #  #  #  #   ##   ###      ##
    /**
     * Unhosts a channel.  Admin-only.
     * @param {User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async unhost(user, message) {
        Commands.checkUserIsAdmin(this.service, user);

        if (message) {
            return false;
        }

        if (!Discord.currentHost) {
            await this.service.queue(`Sorry, ${user}, but you can't stop hosting when the channel isn't hosting anyone.`);
            throw new Error("Not currently hosting a channel.");
        }

        Tmi.unhost("sixgaminggg").catch(() => {});
        await this.service.queue("Exiting host mode.");
        Discord.manualHosting = false;
        Discord.currentHost = "";

        return true;
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
     * @param {User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async addmychannel(user, message) {
        Commands.checkMessageIsFromDiscord(this.service);

        if (message) {
            await this.service.queue(`Sorry, ${user}, but that is not a valid command.  Did you mean to \`!addchannel <channel name>\` to create a voice channel?`);
            return false;
        }

        let streamer;
        try {
            streamer = await Db.getStreamerByDiscord(user.discord.id);
        } catch (err) {
            await this.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
            throw new Exception("There was a database error while checking to see if the user is a streamer.", err);
        }

        if (!streamer) {
            await this.service.queue(`Sorry, ${user}, but you are not currently registered as a streamer.  To get registered, connect your Discord account to Twitch and then go live on Twitch.  The bot will automatically register you as a streamer when it sees you live!`);
            throw new Error("User is not a streamer.");
        }

        let channel;
        try {
            channel = await Discord.createTextChannel(`twitch-${streamer}`);
        } catch (err) {
            await this.service.queue(`Sorry, ${user}, but there was a problem creating your channel.  Does it already exist?`);
            throw new Exception("There was a Discord error while creating a text channel.", err);
        }

        try {
            await channel.setTopic(`This channel is for ${user}'s Twitch stream.  Follow ${user} on Twitch at http://twitch.tv/${streamer}.`);
        } catch (err) {
            await this.service.queue(`Sorry, ${user}, but there was a problem creating your channel.  Does it already exist?`);
            throw new Exception("There was a Discord error while setting the channel's topic.", err);
        }

        await this.service.queue(`${user}, your text channel has now been created at ${channel}.`);

        try {
            await channel.setPosition(9999);
        } catch (err) {
            throw new Exception("There was a Discord error while setting the position of the channel.", err);
        }

        try {
            await Discord.sortDiscordChannels();
        } catch (err) {
            throw new Exception("There was a Discord error while sorting channels.", err);
        }

        return true;
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
     * @param {User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async removemychannel(user, message) {
        Commands.checkMessageIsFromDiscord(this.service);

        if (message) {
            return false;
        }

        let streamer;
        try {
            streamer = await Db.getStreamerByDiscord(user.discord.id);
        } catch (err) {
            await this.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
            throw new Exception("There was a database error while checking to see if the user is a streamer.", err);
        }

        if (!streamer) {
            await this.service.queue(`Sorry, ${user}, but you are not currently registered as a streamer.  Use \`!addtwitch\` to add your channel.`);
            throw new Error("User is not a streamer.");
        }

        const channel = Discord.findChannelByName(`twitch-${streamer}`);
        if (!channel) {
            await this.service.queue(`Sorry, ${user}, but there was a problem removing your text channel.  Are you sure you have one?`);
            throw new Error("Channel does not exist.");
        }

        try {
            channel.delete();
        } catch (err) {
            await this.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
            throw new Exception("There was a Discord error while deleting a channel.", err);
        }

        await this.service.queue(`${user}, your text channel has been removed.  You can always recreate it using \`!addmychannel\`.`);
        return true;
    }

    //          #     #          #
    //          #     #          #
    //  ###   ###   ###   ###   ###   ###    ##    ###  # #    ##   ###
    // #  #  #  #  #  #  ##      #    #  #  # ##  #  #  ####  # ##  #  #
    // # ##  #  #  #  #    ##    #    #     ##    # ##  #  #  ##    #
    //  # #   ###   ###  ###      ##  #      ##    # #  #  #   ##   #
    /**
     * Adds a streamer to the auto hosting rotation.  Discord- and admin-only.
     * @param {User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async addstreamer(user, message) {
        Commands.checkMessageIsFromDiscord(this.service);
        Commands.checkUserIsAdmin(this.service, user);

        let results;
        try {
            results = Twitch.getChannelStream(message);
        } catch (err) {
            await this.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
            throw new Exception("There was a Twitch API error while checking if the streamer exists.", err);
        }

        if (!results) {
            await this.service.queue(`Sorry, ${user}, but ${message} is not a valid Twitch streamer.`);
            throw new Error("Invalid Twitch streamer name.");
        }

        let exists;
        try {
            exists = Db.hostExistsByName(message);
        } catch (err) {
            await this.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
            throw new Exception("There was a database error while checking if the streamer is a hosted streamer.", err);
        }

        if (exists) {
            await this.service.queue(`Sorry, ${user}, but ${message} has already been added as a streamer to be hosted.`);
            throw new Error("Streamer is already a hosted streamer.");
        }

        try {
            await Db.addHost(message);
        } catch (err) {
            await this.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
            throw new Exception("There was a database error while adding a hosted streamer.", err);
        }

        Discord.addHost(message);
        await this.service.queue(`${user}, you have successfully added ${message} as a streamer to be hosted.`);

        return true;
    }

    //                                             #
    //                                             #
    // ###    ##   # #    ##   # #    ##    ###   ###   ###    ##    ###  # #    ##   ###
    // #  #  # ##  ####  #  #  # #   # ##  ##      #    #  #  # ##  #  #  ####  # ##  #  #
    // #     ##    #  #  #  #  # #   ##      ##    #    #     ##    # ##  #  #  ##    #
    // #      ##   #  #   ##    #     ##   ###      ##  #      ##    # #  #  #   ##   #
    /**
     * Removes a streamer from the auto hosting rotation.  Discord- and admin-only.
     * @param {User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async removestreamer(user, message) {
        Commands.checkMessageIsFromDiscord(this.service);
        Commands.checkUserIsAdmin(this.service, user);

        if (!message) {
            return false;
        }

        let id;
        try {
            id = await Db.getHostIdByName(message);
        } catch (err) {
            await this.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
            throw new Exception("There was a database error while checking if the streamer is a hosted streamer.", err);
        }

        if (!id) {
            await this.service.queue(`Sorry, ${user}, but ${message} is not currently a hosted streamer.`);
            throw new Error("Stremaer is not a hosted streamer.");
        }

        try {
            await Db.deleteHostById(id);
        } catch (err) {
            await this.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
            throw new Exception("There was a database error while removing a hosted streamer.", err);
        }

        Discord.removeHost(message);
        await this.service.queue(`${user}, ${message} has been removed as a hosted streamer.`);

        return true;
    }

    //          #     #        #                             ##
    //          #     #        #                              #
    //  ###   ###   ###   ##   ###    ###  ###   ###    ##    #
    // #  #  #  #  #  #  #     #  #  #  #  #  #  #  #  # ##   #
    // # ##  #  #  #  #  #     #  #  # ##  #  #  #  #  ##     #
    //  # #   ###   ###   ##   #  #   # #  #  #  #  #   ##   ###
    /**
     * Adds a voice channel to Discord.  Discord-only.
     * @param {User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async addchannel(user, message) {
        Commands.checkMessageIsFromDiscord(this.service);

        if (!message) {
            await this.service.queue(`Sorry, ${user}, but that is not a valid command.  Did you mean to \`!addmychannel\` to create your own text channel for your Twitch community?`);
            return false;
        }

        if (userCreatedChannels[user.discord.id]) {
            await this.service.queue(`Sorry, ${user}, but you can only create a voice channel once every five minutes.`);
            throw new Error("Can only create a voice channel once every 5 minutes.");
        }

        if (Discord.findChannelByName(message)) {
            await this.service.queue(`Sorry, ${user}, but ${message} already exists as a voice channel.`);
            throw new Error("Channel already exists.");
        }

        let channel;
        try {
            channel = await Discord.createVoiceChannel(message);
        } catch (err) {
            await this.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
            throw new Exception("There was a Discord error while attempting to create a voice channel.", err);
        }

        if (channel.members.size === 0) {
            Discord.markEmptyVoiceChannel(channel);
        }

        userCreatedChannels[user.discord.id] = setTimeout(() => {
            delete userCreatedChannels[user.discord.id];
        }, 300000);

        await this.service.queue(`${user}, the voice channel ${message} has been created.  It will be automatically deleted after being empty for 5 minutes.`);

        return true;
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
     * @param {User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async addgame(user, message) {
        Commands.checkMessageIsFromDiscord(this.service);
        Commands.checkUserIsAdmin(this.service, user);

        if (!addGameParse.test(message)) {
            return false;
        }

        const {1: short, 2: game} = addGameParse.exec(message);
        if (Discord.findRoleByName(short)) {
            await this.service.queue(`Sorry, ${user}, but the role for game ${short} has already been created.`);
            throw new Error("Game has already been added.");
        }

        try {
            await Db.addGame(game, short);
        } catch (err) {
            await this.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
            throw new Exception("There was a database error while adding the game to the table.", err);
        }

        let role;
        try {
            role = await Discord.createRole({
                name: short,
                color: 0xFF0000,
                hoist: false,
                mentionable: true
            });
        } catch (err) {
            await this.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
            throw new Exception("There was a Discord error while creating the game's role.", err);
        }

        try {
            await Discord.addUserToRole(user.discord, role);
        } catch (err) {
            await this.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
            throw new Exception("There was a Discord error while adding the user to the new role.", err);
        }

        await this.service.queue(`${user}, ${role} has been setup as a mentionable role with you as the first member!  You may also discuss the game in #games.  Anyone may join this role to be notified by entering \`!notify ${short}\`.`);
        return true;
    }

    // ###    ##   # #    ##   # #    ##    ###   ###  # #    ##
    // #  #  # ##  ####  #  #  # #   # ##  #  #  #  #  ####  # ##
    // #     ##    #  #  #  #  # #   ##     ##   # ##  #  #  ##
    // #      ##   #  #   ##    #     ##   #      # #  #  #   ##
    //                                      ###
    /**
     * Removes a game from notifications.  Discord- and owner-only.
     * @param {User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async removegame(user, message) {
        Commands.checkMessageIsFromDiscord(this.service);
        Commands.checkUserIsOwner(user);

        if (!message) {
            return false;
        }

        message = message.toLowerCase();

        const role = Discord.findRoleByName(message);

        if (role) {
            try {
                role.delete();
            } catch (err) {
                await this.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
                throw new Exception("There was a Discord error while removing a role.", err);
            }
        }

        try {
            await Db.deleteGameByCode(message);
        } catch (err) {
            await this.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
            throw new Exception("There was a database error while removing a game from the table.", err);
        }

        await this.service.queue(`${user}, the game ${message} has been removed.`);
        return true;
    }

    //  ###   ###  # #    ##    ###
    // #  #  #  #  ####  # ##  ##
    //  ##   # ##  #  #  ##      ##
    // #      # #  #  #   ##   ###
    //  ###
    /**
     * Whispers a list of games to be notified for to a user.  Discord-only.
     * @param {User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async games(user, message) {
        Commands.checkMessageIsFromDiscord(this.service);

        if (message) {
            return false;
        }

        let games;
        try {
            games = await Db.getGames();
        } catch (err) {
            await this.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
            throw new Exception("There was a database error while retrieving the games list.", err);
        }

        if (!games || games.length === 0) {
            await this.service.queue(`Sorry, ${user}, but there are no games to be notified for.`);
            throw new Error("There are no games to be notified for.");
        }

        let response = "You may use `!notify <game>` for the following games:";

        games.forEach((row) => {
            response += `\n\`${row.code}\` - ${row.game}`;
        });

        await this.service.queue(response, user.discord);
        return true;
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
     * @param {User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async notify(user, message) {
        Commands.checkMessageIsFromDiscord(this.service);

        if (!message) {
            return false;
        }

        message = message.toLowerCase();

        const role = Discord.findRoleByName(message);

        if (!role) {
            await this.service.queue(`Sorry, ${user}, but the game ${message} does not exist.`);
            throw new Error("Game does not exist.");
        }

        try {
            await Discord.addUserToRole(user.discord, role);
        } catch (err) {
            await this.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
            throw new Exception("There was a Discord error while attempting to add the user to the role.", err);
        }

        await this.service.queue(`${user}, you have been setup to be notified whenever ${role.name} is mentioned!`);
        return true;
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
     * @param {User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async unnotify(user, message) {
        Commands.checkMessageIsFromDiscord(this.service);

        if (!message) {
            return false;
        }

        message = message.toLowerCase();

        const role = Discord.findRoleByName(message);

        if (!role) {
            await this.service.queue(`Sorry, ${user}, but the game ${message} does not exist.`);
            throw new Error("Game does not exist.");
        }

        try {
            await Discord.removeUserFromRole(user.discord, role);
        } catch (err) {
            await this.service.queue(`Sorry, ${user}, but the server is currently down.  Try later, or get a hold of roncli for fixing.`);
            throw new Exception("There was a Discord error while attempting to remove the user from the role.", err);
        }

        await this.service.queue(`${user}, you have been setup to no longer be notified whenever ${role.name} is mentioned!`);

        return true;
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
     * @param {User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async streamnotify(user, message) {
        Commands.checkMessageIsFromDiscord(this.service);

        if (message) {
            return false;
        }

        try {
            await Discord.addStreamNotifyRole(user.discord);
        } catch (err) {
            await this.service.queue(`Sorry, ${user}, but there was a problem with setting you up for being notified when Six Gaming or one of its members is live on Twitch.  Are you sure you're not already setup to be notified?`);
            throw new Exception("There was a Discord error while attempting to add the user to the role.", err);
        }

        await this.service.queue(`${user}, you have been setup to be notified when Six Gaming or one of its members is live on Twitch!`);
        return true;
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
     * @param {User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async streamunnotify(user, message) {
        Commands.checkMessageIsFromDiscord(this.service);

        if (message) {
            return false;
        }

        try {
            await Discord.removeStreamNotifyRole(user.discord);
        } catch (err) {
            await this.service.queue(`Sorry, ${user}, but there was a problem with setting you up to not be notified when Six Gaming or one of its members is live on Twitch.  Are you sure you were setup to be notified?`);
            throw new Exception("There was a Discord error while attempting to remove the user from the role.", err);
        }

        await this.service.queue(`${user}, you have been setup to be no longer be notified when Six Gaming or one of its members is live on Twitch.`);
        return true;
    }

    //                      #                           #
    //                      #
    // ###    ###  ###    ###   ##   # #    ##   ###   ##    #  #  # #
    // #  #  #  #  #  #  #  #  #  #  ####  #  #  #  #   #    #  #  ####
    // #     # ##  #  #  #  #  #  #  #  #  #  #  #  #   #    #  #  #  #
    // #      # #  #  #   ###   ##   #  #   ##   #  #  ###    ###  #  #
    /**
     * Assigns a random Overwatch hero to everyone in the user's voice channel.  Discord-only.
     * @param {User} user The user initiating the command.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async randomonium(user, message) {
        Commands.checkMessageIsFromDiscord(this.service);

        const voiceChannel = Discord.getUserVoiceChannel(user.discord);

        if (!voiceChannel) {
            await this.service.queue(`Sorry, ${user}, but you must be in a voice channel to use this command.`);
            throw new Error("User was not in a voice channel.");
        }

        const heroes = randomonium.getHeroes(voiceChannel.members.size, message === "dupe" || message === "dupes");

        let index = 0;

        for (const member of voiceChannel.members.array()) {
            if (voiceChannel && member.voiceChannel && voiceChannel.id === member.voiceChannel.id) {
                await this.service.queue(`${member}: ${heroes[index]}`);
            }
            index++;
        }

        return true;
    }
}

module.exports = Commands;
