/**
 * @typedef {import("twitch").Channel} TwitchApi.Channel
 * @typedef {import("twitch").HelixStream} TwitchApi.HelixStream
 * @typedef {import("twitch").default} TwitchApi.TwitchClient
 */

const {default: TwitchApi, HelixStreamType} = require("twitch"),

    settings = require("./settings");

/**
 * @type {TwitchApi.TwitchClient}
 */
let twitchApi;

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
    //  #           #     #
    //                    #
    // ##    ###   ##    ###
    //  #    #  #   #     #
    //  #    #  #   #     #
    // ###   #  #  ###     ##
    /**
     * Initializes the twitch API client.
     * @returns {Promise} A promise that resolves when the client has been initialized.
     */
    static async init() {
        if (!twitchApi) {
            twitchApi = await TwitchApi.withClientCredentials(settings.twitch.clientId, settings.twitch.clientSecret);
        }
    }

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
     * @returns {Promise<TwitchApi.HelixStream[]>} An array of streams that are live from the provided list of channels.
     */
    static async getStreams(channels) {
        await Twitch.init();

        return twitchApi.helix.streams.getStreamsPaginated({userName: channels, type: HelixStreamType.Live}).getAll();
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
     * @returns {Promise<TwitchApi.Channel>} The channel's stream information.
     */
    static async getChannelStream(channel) {
        await Twitch.init();

        return twitchApi.kraken.channels.getChannel(channel);
    }
}

module.exports = Twitch;
