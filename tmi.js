const TmiJs = require("tmi.js"),

    Commands = require("./commands"),
    Log = require("./log"),
    settings = require("./settings"),

    autoCommandRotation = [
        "facebook",
        "twitter",
        "youtube",
        "itunes",
        "discord",
        "website"
    ],
    chatters = {},
    messageParse = /^!([^ ]+)(?: +(.+[^ ]))? *$/,
    tmi = new TmiJs.Client(settings.tmi);

let commandRotationTimeout = 0,
    commandRotationWait = 5;

//  #####           #
//    #
//    #    ## #    ##
//    #    # # #    #
//    #    # # #    #
//    #    # # #    #
//    #    #   #   ###
/**
 * A class that handles calls to tmi.js.
 */
class Tmi {
    //         #                 #
    //         #                 #
    //  ###   ###    ###  ###   ###   #  #  ###
    // ##      #    #  #  #  #   #    #  #  #  #
    //   ##    #    # ##  #      #    #  #  #  #
    // ###      ##   # #  #       ##   ###  ###
    //                                      #
    /**
     * Starts up the connection to tmi.
     * @returns {void}
     */
    static startup() {
        Tmi.commands = new Commands(Tmi);

        tmi.on("connected", () => {
            Log.log("Connected to tmi.");
            tmi.raw("CAP REQ :twitch.tv/membership");
        });

        tmi.on("disconnected", (ev) => {
            Log.exception("Disconnected from tmi...", ev);
        });

        tmi.on("message", (channel, userstate, text, self) => {
            if (!self && channel === "#sixgaminggg") {
                Tmi.message(userstate["display-name"], text);
            }
        });

        tmi.on("names", (channel, users) => {
            if (channel === "#sixgaminggg") {
                users.forEach((username) => {
                    chatters[username] = "";
                });
            }
        });

        tmi.on("join", (channel, username, self) => {
            if (!self && channel === "#sixgaminggg") {
                chatters[username] = "";
            }
        });

        tmi.on("part", (channel, username, self) => {
            if (!self && channel === "#sixgaminggg") {
                delete chatters[username];
            }
        });

        tmi.on("mod", (channel, username) => {
            if (channel === "#sixgaminggg") {
                chatters[username] = "o";
                if (username !== "sixbotgg" && username !== "sixgaminggg") {
                    Tmi.queue(`Hi, ${username}! HeyGuys`);
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
     * Connects to tmi.
     * @returns {void}
     */
    static connect() {
        Log.log("Connecting to tmi...");
        tmi.connect();

        // Setup IRC command rotation.
        clearTimeout(commandRotationTimeout);
        commandRotationTimeout = setTimeout(() => Tmi.commandRotation(), 600000);
    }

    // # #    ##    ###    ###    ###   ###   ##
    // ####  # ##  ##     ##     #  #  #  #  # ##
    // #  #  ##      ##     ##   # ##   ##   ##
    // #  #   ##   ###    ###     # #  #      ##
    //                                  ###
    /**
     * Parses a message.
     * @param {string} user The user who sent the message.
     * @param {string} text The text of the message.
     * @returns {void}
     */
    static message(user, text) {
        const matches = messageParse.exec(text);

        commandRotationWait--;

        if (matches) {
            if (Object.getOwnPropertyNames(Commands.prototype).filter((p) => typeof Commands.prototype[p] === "function" && p !== "constructor").indexOf(matches[1]) !== -1) {
                Tmi.commands[matches[1]](user, matches[2]).then((success) => {
                    if (success) {
                        Log.log(`${user}: ${text}`);
                    }
                }).catch((err) => {
                    if (err.innerError) {
                        Log.exception(err.message, err.innerError);
                    } else {
                        Log.warning(err);
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
     * @returns {Promise} A promise that resolves when the message is sent.
     */
    static queue(message) {
        return tmi.say("sixgaminggg", message);
    }

    // #                   #
    // #                   #
    // ###    ##    ###   ###
    // #  #  #  #  ##      #
    // #  #  #  #    ##    #
    // #  #   ##   ###      ##
    /**
     * Hosts a channel.
     * @param {string} hostingChannel The hosting channel.
     * @param {string} hostedChannel The hosted channel.
     * @return {Promise} A promise that resolves when hosting completes.
     */
    static host(hostingChannel, hostedChannel) {
        return tmi.host(hostingChannel, hostedChannel);
    }

    //             #                   #
    //             #                   #
    // #  #  ###   ###    ##    ###   ###
    // #  #  #  #  #  #  #  #  ##      #
    // #  #  #  #  #  #  #  #    ##    #
    //  ###  #  #  #  #   ##   ###      ##
    /**
     * Ends hosting on a channel.
     * @param {string} hostingChannel The hosting channel that will end hosting.
     * @return {Promise} A promise that resolves when unhosting completes.
     */
    static unhost(hostingChannel) {
        return tmi.unhost(hostingChannel);
    }

    //  #           #  #           #
    //              ####           #
    // ##     ###   ####   ##    ###
    //  #    ##     #  #  #  #  #  #
    //  #      ##   #  #  #  #  #  #
    // ###   ###    #  #   ##    ###
    /**
     * Returns whether the user is a mod.
     * @param {string} username The username to check.
     * @returns {boolean} Whether the user is a mod.
     */
    static isMod(username) {
        return chatters[username] === "o";
    }

    //                                        #  ###          #           #     #
    //                                        #  #  #         #           #
    //  ##    ##   # #   # #    ###  ###    ###  #  #   ##   ###    ###  ###   ##     ##   ###
    // #     #  #  ####  ####  #  #  #  #  #  #  ###   #  #   #    #  #   #     #    #  #  #  #
    // #     #  #  #  #  #  #  # ##  #  #  #  #  # #   #  #   #    # ##   #     #    #  #  #  #
    //  ##    ##   #  #  #  #   # #  #  #   ###  #  #   ##     ##   # #    ##  ###    ##   #  #
    /**
     * Automatically sends a rotating message to chat every 10 minutes.
     * @returns {void}
     */
    static commandRotation() {
        if (commandRotationWait <= 0) {
            Tmi.message("SixBotGG", `!${autoCommandRotation[0]}`);
        } else {
            commandRotationTimeout = setTimeout(() => Tmi.commandRotation(), 600000);
        }
    }

    //              #           #           ##                                    #
    //              #           #          #  #                                   #
    // ###    ##   ###    ###  ###    ##   #      ##   # #   # #    ###  ###    ###
    // #  #  #  #   #    #  #   #    # ##  #     #  #  ####  ####  #  #  #  #  #  #
    // #     #  #   #    # ##   #    ##    #  #  #  #  #  #  #  #  # ##  #  #  #  #
    // #      ##     ##   # #    ##   ##    ##    ##   #  #  #  #   # #  #  #   ###
    /**
     * Rotates the automatic messages.
     * @param {string} command The command to rotate out.
     * @returns {void}
     */
    static rotateCommand(command) {
        const index = autoCommandRotation.indexOf(command);

        if (index !== -1) {
            clearTimeout(commandRotationTimeout);

            commandRotationWait = 5;
            autoCommandRotation.splice(index, 1);
            autoCommandRotation.push(command);

            commandRotationTimeout = setTimeout(() => Tmi.commandRotation(), 600000);
        }
    }
}

module.exports = Tmi;
