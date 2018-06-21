const util = require("util"),

    queue = [];

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

        if (Discord.isConnected()) {
            const logChannel = Discord.findChannelByName("sixbotgg-log"),
                errorChannel = Discord.findChannelByName("sixbotgg-errors");

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
                    message.embed.fields.push({
                        name: "Message",
                        value: util.inspect(log.obj)
                    });
                }

                Discord.richQueue(message, log.type === "exception" ? errorChannel : logChannel);
            });

            queue.splice(0, queue.length);
        } else {
            console.log(queue[queue.length - 1]);
        }
    }
}

module.exports = Log;
