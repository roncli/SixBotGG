const util = require("util"),

    DiscordJs = require("discord.js");

/**
 * @type {{type: string, date: Date, obj?: Error, message?: string}[]}
 */
const queue = [];

/**
 * @type {typeof import("./discord")}
 */
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
    // ##
    //  #
    //  #     ##    ###
    //  #    #  #  #  #
    //  #    #  #   ##
    // ###    ##   #
    //              ###
    /**
     * Logs a message.
     * @param {string} message The message to log.
     * @returns {void}
     */
    static log(message) {
        queue.push({
            type: "log",
            date: new Date(),
            message
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
     * @param {string} message The string to log.
     * @returns {void}
     */
    static warning(message) {
        queue.push({
            type: "warning",
            date: new Date(),
            message
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
     * @param {Error} [obj] The object to log.
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

        if (Discord.isConnected()) {

            queue.forEach((log) => {
                const message = new DiscordJs.RichEmbed({
                    color: log.type === "log" ? 0x80FF80 : log.type === "warning" ? 0xFFFF00 : 0xFF0000,
                    fields: [],
                    timestamp: log.date
                });

                if (log.message) {
                    message.setDescription(log.message);
                }

                if (log.obj) {
                    message.fields.push({
                        name: "Message",
                        value: util.inspect(log.obj)
                    });
                }

                Discord.richQueue(message, /** @type {DiscordJs.TextChannel} */ (Discord.findChannelByName(log.type === "exception" ? "sixbotgg-errors" : "sixbotgg-log"))); // eslint-disable-line no-extra-parens
            });

            queue.splice(0, queue.length);
        } else {
            console.log(queue[queue.length - 1]);
        }
    }
}

module.exports = Log;
