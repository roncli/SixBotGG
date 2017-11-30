const queue = [];

let Discord;

//  #
//  #
//  #       ###    ## #
//  #      #   #  #  #
//  #      #   #   ##
//  #      #   #  #
//  #####   ###    ###
//                #   #
//                 ###
/**
 * A class that handles logging.
 */
class Log {
    //                   ##                      ####
    //                    #                      #
    // ###    ##   ###    #     ###   ##    ##   ###   ###   ###    ##   ###    ###
    // #  #  # ##  #  #   #    #  #  #     # ##  #     #  #  #  #  #  #  #  #  ##
    // #     ##    #  #   #    # ##  #     ##    #     #     #     #  #  #       ##
    // #      ##   ###   ###    # #   ##    ##   ####  #     #      ##   #     ###
    //             #
    /**
     * A JSON.stringify helper function that turns errors into normal objects prior to stringifying them.
     * @param {*} _ Unused.
     * @param {*} value The object to be translated.
     * @returns {*} The original object if not an error, or the error as an object.
     */
    static replaceErrors(_, value) {
        if (value instanceof Error) {
            const error = {};

            Object.getOwnPropertyNames(value).forEach((key) => {
                ({[key]: error[key]} = value);
            });

            return error;
        }

        return value;
    }

    // ##
    //  #
    //  #     ##    ###
    //  #    #  #  #  #
    //  #    #  #   ##
    // ###    ##   #
    //              ###
    /**
     * Logs a message.
     * @param {*} obj The object to log.
     * @returns {void}
     */
    static log(obj) {
        queue.push({
            type: "log",
            date: new Date(),
            obj
        });
        Log.output();
    }

    //                          #
    //
    // #  #   ###  ###   ###   ##    ###    ###
    // #  #  #  #  #  #  #  #   #    #  #  #  #
    // ####  # ##  #     #  #   #    #  #   ##
    // ####   # #  #     #  #  ###   #  #  #
    //                                      ###
    /**
     * Logs a warning.
     * @param {*} obj The object to log.
     * @returns {void}
     */
    static warning(obj) {
        queue.push({
            type: "warning",
            date: new Date(),
            obj
        });
        Log.output();
    }

    //                                #     #
    //                                #
    //  ##   #  #   ##    ##   ###   ###   ##     ##   ###
    // # ##   ##   #     # ##  #  #   #     #    #  #  #  #
    // ##     ##   #     ##    #  #   #     #    #  #  #  #
    //  ##   #  #   ##    ##   ###     ##  ###    ##   #  #
    //                         #
    /**
     * Logs an exception.
     * @param {string} message The message describing the error.
     * @param {*} obj The object to log.
     * @returns {void}
     */
    static exception(message, obj) {
        queue.push({
            type: "exception",
            date: new Date(),
            message,
            obj
        });
        Log.output();
    }

    //              #                 #
    //              #                 #
    //  ##   #  #  ###   ###   #  #  ###
    // #  #  #  #   #    #  #  #  #   #
    // #  #  #  #   #    #  #  #  #   #
    //  ##    ###    ##  ###    ###    ##
    //                   #
    /**
     * Outputs the log queue.
     * @returns {void}
     */
    static output() {
        if (!Discord) {
            Discord = require("./discord");
        }

        const logChannel = Discord.findChannelByName("sixbotgg-log"),
            errorChannel = Discord.findChannelByName("sixbotgg-errors");

        if (Discord.isConnected()) {
            queue.forEach((log) => {
                const message = {
                    embed: {
                        color: log.type === "log" ? 0x80FF80 : log.type === "warning" ? 0xFFFF00 : log.type === "exception" ? 0xFF0000 : 0x16F6F8,
                        footer: {icon_url: Discord.icon}, // eslint-disable-line camelcase
                        fields: [],
                        timestamp: log.date
                    }
                };

                if (log.message) {
                    ({message: message.embed.description} = log);
                }

                if (log.obj) {
                    switch (typeof log.obj) {
                        case "string":
                            message.embed.fields.push({value: log.obj});
                            break;
                        default:
                            if (log.obj instanceof Error) {
                                message.embed.fields.push({
                                    name: "Stack Trace",
                                    value: `\`\`\`${JSON.stringify(log.obj, Log.replaceErrors)}\`\`\``
                                });
                            } else {
                                message.embed.fields.push({value: `\`\`\`${JSON.stringify(log.obj, Log.replaceErrors)}\`\`\``});
                            }
                            break;
                    }
                }

                Discord.richQueue(message, log.type === "exception" ? errorChannel : logChannel);
            });

            queue.splice(0, queue.length);
        }
    }
}

module.exports = Log;
