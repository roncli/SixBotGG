const TwitchApi = require("twitch-api"),
    settings = require("./settings"),
    twitch = new TwitchApi(settings.twitch);

//  #####           #     #            #
//    #                   #            #
//    #    #   #   ##    ####    ###   # ##
//    #    #   #    #     #     #   #  ##  #
//    #    # # #    #     #     #      #   #
//    #    # # #    #     #  #  #   #  #   #
//    #     # #    ###     ##    ###   #   #
/**
 * A class that encapsulates functions needed from the twitch-api library.
 */
class Twitch {
    //              #     ##    #
    //              #    #  #   #
    //  ###   ##   ###    #    ###   ###    ##    ###  # #    ###
    // #  #  # ##   #      #    #    #  #  # ##  #  #  ####  ##
    //  ##   ##     #    #  #   #    #     ##    # ##  #  #    ##
    // #      ##     ##   ##     ##  #      ##    # #  #  #  ###
    //  ###
    /**
     * Returns the streams that are live from the provided list of channels.
     * @param {string[]} channels An array of channels to check.
     * @param {number} [offset] For internal use only.  The offset in the returned streams.
     * @param {Object[]} [streams] For internal use only.  An array of intermediate results.
     * @returns {Promise<Object[]>} An array of streams that are live from the provided list of channels.
     */
    static getStreams(channels, offset, streams) {
        let recurse = false;

        if (offset === void 0) {
            offset = 0;
            streams = [];
        }

        return new Promise((resolve, reject) => {
            twitch.getStreams({channel: channels, limit: 100, "stream_type": "live", offset}, (err, results) => {
                if (err || !results) {
                    reject(err, results);
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
                    recurse = true;
                }

                resolve();
            });
        }).then(() => {
            if (recurse) {
                console.log(offset);
                return Twitch.getStreams(channels, offset + 100, streams);
            }

            return streams;
        });
    }

    //              #     ##   #                             ##     ##    #
    //              #    #  #  #                              #    #  #   #
    //  ###   ##   ###   #     ###    ###  ###   ###    ##    #     #    ###   ###    ##    ###  # #
    // #  #  # ##   #    #     #  #  #  #  #  #  #  #  # ##   #      #    #    #  #  # ##  #  #  ####
    //  ##   ##     #    #  #  #  #  # ##  #  #  #  #  ##     #    #  #   #    #     ##    # ##  #  #
    // #      ##     ##   ##   #  #   # #  #  #  #  #   ##   ###    ##     ##  #      ##    # #  #  #
    //  ###
    /**
     * Returns the channel's stream information.
     * @param {string} channel The channel to check.
     * @returns {Promise<Object>} The channel's stream information.
     */
    static getChannelStream(channel) {
        return new Promise((resolve, reject) => {
            twitch.getChannelStream(channel, (err, results) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(results);
            });
        });
    }
}

module.exports = Twitch;
