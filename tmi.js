const TwitchJs = require("twitch-js"),

    Commands = require("./commands"),
    Exception = require("./exception"),
    Log = require("./log"),
    settings = require("./settings"),
    Warning = require("./warning"),

    autoCommandRotation = [
        "facebook",
        "twitter",
        "youtube",
        "itunes",
        "discord",
        "website"
    ],
    chatters = {},
    messageParse = /^!(?<cmd>[^ ]+)(?: +(?<args>.+[^ ]))? *$/,
    tmi = new TwitchJs.Client(settings.tmi);

let commandRotationWait = 5;

/**
 * @type {Commands}
 */
let commands;

/**
 * @type {NodeJS.Timeout}
 */
let commandRotationTimeout;

//  #####           #
//    #
//    #    ## #    ##
//    #    # # #    #
//    #    # # #    #
//    #    # # #    #
//    #    #   #   ###
/**
 * A class that handles calls to twitch-js.
 * @property {Commands} Tmi.commands
 */
class Tmi {
    //                                        #
    //                                        #
    //  ##    ##   # #   # #    ###  ###    ###   ###
    // #     #  #  ####  ####  #  #  #  #  #  #  ##
    // #     #  #  #  #  #  #  # ##  #  #  #  #    ##
    //  ##    ##   #  #  #  #   # #  #  #   ###  ###
    /**
     * Gets the commands object.
     * @returns {Commands} The commands object.
     */
    static get commands() {
        return commands;
    }

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
        commands = new Commands(Tmi);

        tmi.on("connected", async () => {
            Log.log("Connected to tmi.");

            try {
                await tmi.raw("CAP REQ :twitch.tv/membership");
            } catch (err) {
                Log.exception("Raw command failed.", err);
            }
        });

        tmi.on("disconnected", (ev) => {
            Log.exception("Disconnected from tmi...", ev);
        });

        tmi.on("message", async (channel, userstate, text, self) => {
            if (!self && channel === "#sixgaminggg") {
                await Tmi.message(userstate["display-name"], text);
            }
        });

        tmi.on("names", (channel, users) => {
            if (channel === "#sixgaminggg") {
                users.forEach((username) => {
                    if (!chatters[username]) {
                        chatters[username] = "";
                    }
                });
            }
        });

        tmi.on("join", (channel, username, self) => {
            if (!self && channel === "#sixgaminggg") {
                if (!chatters[username]) {
                    chatters[username] = "";
                }
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
     * @returns {Promise} A promise that resolves when tmi is connected.
     */
    static async connect() {
        Log.log("Connecting to tmi...");

        try {
            await tmi.connect();
        } catch (err) {
            Log.exception("tmi connection failed.", err);
        }

        // Setup IRC command rotation.
        clearTimeout(commandRotationTimeout);
        commandRotationTimeout = setTimeout(Tmi.commandRotation, 600000);
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
     * @returns {Promise} A promise that resolves when the message is parsed.
     */
    static async message(user, text) {
        if (messageParse.test(text)) {
            const {groups: {cmd, args}} = messageParse.exec(text),
                command = cmd.toLocaleLowerCase();

            if (Object.getOwnPropertyNames(Commands.prototype).filter((p) => typeof Commands.prototype[p] === "function" && p !== "constructor").indexOf(command) !== -1) {
                let success;
                try {
                    await Tmi.commands[command](user, args);
                } catch (err) {
                    if (err instanceof Warning) {
                        Log.warning(`${user}: ${text}\n${err}`);
                    } else if (err instanceof Exception) {
                        Log.exception(err.message, err.innerError);
                    } else {
                        Log.exception("Unhandled error found.", err);
                    }

                    return;
                }

                if (success) {
                    Log.log(`${user}: ${text}`);
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
     * @returns {Promise} A promise that resolves when the message is sent.
     */
    static async queue(message) {
        try {
            await tmi.say("sixgaminggg", message);
        } catch (err) {
            Log.exception("Say command failed.", err);
        }
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
    static async host(hostingChannel, hostedChannel) {
        try {
            await tmi.host(hostingChannel, hostedChannel);
        } catch (err) {
            if (err === "bad_host_hosting") {
                // Not an error, we're just already hosting that channel.
                return;
            }

            if (err === "No response from Twitch.") {
                Log.log(`Host command from ${hostingChannel} to ${hostedChannel} failed due to no response from Twitch.`);
            } else {
                Log.exception(`Host command from ${hostingChannel} to ${hostedChannel} failed.`, err);
            }
        }
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
    static async unhost(hostingChannel) {
        try {
            await tmi.unhost(hostingChannel);
        } catch (err) {
            if (err === "No response from Twitch.") {
                Log.log(`Unhost command from ${hostingChannel} failed due to no response from Twitch.`);
            } else {
                Log.exception(`Unhost command from ${hostingChannel} failed.`, err);
            }
        }
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
     * @returns {Promise} A promise that resolves when a command is sent.
     */
    static async commandRotation() {
        if (commandRotationWait <= 0) {
            await Tmi.message("SixBotGG", `!${autoCommandRotation[0]}`);
        } else {
            commandRotationTimeout = setTimeout(Tmi.commandRotation, 600000);
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
            commandRotationWait = 5;
            autoCommandRotation.splice(index, 1);
            autoCommandRotation.push(command);
        }

        clearTimeout(commandRotationTimeout);
        commandRotationTimeout = setTimeout(Tmi.commandRotation, 600000);
    }
}

module.exports = Tmi;
