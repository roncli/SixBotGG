const Db = require("node-database"),
    settings = require("./settings"),
    db = new Db(settings.database);

//  ####           #            #
//   #  #          #            #
//   #  #   ###   ####    ###   # ##    ###    ###    ###
//   #  #      #   #         #  ##  #      #  #      #   #
//   #  #   ####   #      ####  #   #   ####   ###   #####
//   #  #  #   #   #  #  #   #  ##  #  #   #      #  #
//  ####    ####    ##    ####  # ##    ####  ####    ###
/**
* Defines the database class.
*/
class Database {
    //              #     ##    #                                        ###         ###    #                                #
    //              #    #  #   #                                        #  #        #  #                                    #
    //  ###   ##   ###    #    ###   ###    ##    ###  # #    ##   ###   ###   #  #  #  #  ##     ###    ##    ##   ###    ###
    // #  #  # ##   #      #    #    #  #  # ##  #  #  ####  # ##  #  #  #  #  #  #  #  #   #    ##     #     #  #  #  #  #  #
    //  ##   ##     #    #  #   #    #     ##    # ##  #  #  ##    #     #  #   # #  #  #   #      ##   #     #  #  #     #  #
    // #      ##     ##   ##     ##  #      ##    # #  #  #   ##   #     ###     #   ###   ###   ###     ##    ##   #      ###
    //  ###                                                                     #
    /**
     * Gets a streamer's name by their Discord ID.
     * @param {string} discord The user's Discord ID.
     * @returns {Promise<string>} A promise that resolves with the streamer's name.
     */
    static getStreamerByDiscord(discord) {
        return db.query("select streamer from streamer where discord = @discord", {discord: {type: Db.VARCHAR(50), value: discord}}).then((data) => data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].streamer);
    }

    // #                   #    ####         #            #           ###         #  #
    // #                   #    #                         #           #  #        ## #
    // ###    ##    ###   ###   ###   #  #  ##     ###   ###    ###   ###   #  #  ## #   ###  # #    ##
    // #  #  #  #  ##      #    #      ##    #    ##      #    ##     #  #  #  #  # ##  #  #  ####  # ##
    // #  #  #  #    ##    #    #      ##    #      ##    #      ##   #  #   # #  # ##  # ##  #  #  ##
    // #  #   ##   ###      ##  ####  #  #  ###   ###      ##  ###    ###     #   #  #   # #  #  #   ##
    //                                                                       #
    /**
     * Gets whether a host exists by their name.
     * @param {string} name The name of the host.
     * @returns {Promise<boolean>} A promise that resolves with whether the host exists.
     */
    static hostExistsByName(name) {
        return db.query("select top 1 1 found from host where streamer = @streamer", {streamer: {type: Db.VARCHAR(50), value: name}}).then((data) => !!(data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].found === 1));
    }

    //              #    #  #                #    ###      #  ###         #  #
    //              #    #  #                #     #       #  #  #        ## #
    //  ###   ##   ###   ####   ##    ###   ###    #     ###  ###   #  #  ## #   ###  # #    ##
    // #  #  # ##   #    #  #  #  #  ##      #     #    #  #  #  #  #  #  # ##  #  #  ####  # ##
    //  ##   ##     #    #  #  #  #    ##    #     #    #  #  #  #   # #  # ##  # ##  #  #  ##
    // #      ##     ##  #  #   ##   ###      ##  ###    ###  ###     #   #  #   # #  #  #   ##
    //  ###                                                          #
    /**
     * Gets the database ID of a host by their name.
     * @param {string} name The name of the host.
     * @returns {Promise<number>} A promise that resolves with the database ID of the host.
     */
    static getHostIdByName(name) {
        return db.query("select id from host where streamer = @streamer", {streamer: {type: Db.VARCHAR(50), value: name}}).then((data) => data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].id);
    }

    //          #     #  #  #                #
    //          #     #  #  #                #
    //  ###   ###   ###  ####   ##    ###   ###
    // #  #  #  #  #  #  #  #  #  #  ##      #
    // # ##  #  #  #  #  #  #  #  #    ##    #
    //  # #   ###   ###  #  #   ##   ###      ##
    /**
     * Adds a host to the database.
     * @param {string} name The name of the host.
     * @returns {Promise} A promise that resolves when the host has been added to the database.
     */
    static addHost(name) {
        return db.query("insert into host (streamer) values (@streamer)", {streamer: {type: Db.VARCHAR(50), value: name}});
    }

    //    #        ##           #          #  #                #    ###         ###      #
    //    #         #           #          #  #                #    #  #         #       #
    //  ###   ##    #     ##   ###    ##   ####   ##    ###   ###   ###   #  #   #     ###
    // #  #  # ##   #    # ##   #    # ##  #  #  #  #  ##      #    #  #  #  #   #    #  #
    // #  #  ##     #    ##     #    ##    #  #  #  #    ##    #    #  #   # #   #    #  #
    //  ###   ##   ###    ##     ##   ##   #  #   ##   ###      ##  ###     #   ###    ###
    //                                                                     #
    /**
     * Deletes a host by their database ID.
     * @param {number} id The database ID of the host to delete.
     * @returns {Promise} A promise that resolves when the host has been deleted.
     */
    static deleteHostById(id) {
        return db.query("delete from host where id = @id", {id: {type: Db.INT, value: id}});
    }

    //    #        ##           #          #  #                #    ###         #  #
    //    #         #           #          #  #                #    #  #        #  #
    //  ###   ##    #     ##   ###    ##   ####   ##    ###   ###   ###   #  #  #  #   ###    ##   ###
    // #  #  # ##   #    # ##   #    # ##  #  #  #  #  ##      #    #  #  #  #  #  #  ##     # ##  #  #
    // #  #  ##     #    ##     #    ##    #  #  #  #    ##    #    #  #   # #  #  #    ##   ##    #
    //  ###   ##   ###    ##     ##   ##   #  #   ##   ###      ##  ###     #    ##   ###     ##   #
    //                                                                     #
    /**
     * Deletes a host by their stream name.
     * @param {string} name The name of the host to delete.
     * @returns {Promise} A promise that resolves when the host has been deleted.
     */
    static deleteHostByUser(name) {
        return db.query("delete from host where streamer = @user", {user: {type: Db.VARCHAR(50), value: name}});
    }

    //    #        ##           #           ##    #                                        ###         ###    #                                #
    //    #         #           #          #  #   #                                        #  #        #  #                                    #
    //  ###   ##    #     ##   ###    ##    #    ###   ###    ##    ###  # #    ##   ###   ###   #  #  #  #  ##     ###    ##    ##   ###    ###
    // #  #  # ##   #    # ##   #    # ##    #    #    #  #  # ##  #  #  ####  # ##  #  #  #  #  #  #  #  #   #    ##     #     #  #  #  #  #  #
    // #  #  ##     #    ##     #    ##    #  #   #    #     ##    # ##  #  #  ##    #     #  #   # #  #  #   #      ##   #     #  #  #     #  #
    //  ###   ##   ###    ##     ##   ##    ##     ##  #      ##    # #  #  #   ##   #     ###     #   ###   ###   ###     ##    ##   #      ###
    //                                                                                            #
    /**
     * Deletes a streamer by their Discord ID.
     * @param {string} discord The Discord ID of the streamer to delete.
     * @returns {Promise} A promise that resolves when the streamer has been deleted.
     */
    static deleteStreamerByDiscord(discord) {
        return db.query("delete from streamer where discord = @discord", {discord: {type: Db.VARCHAR(50), value: discord}});
    }

    //          #     #   ##
    //          #     #  #  #
    //  ###   ###   ###  #      ###  # #    ##
    // #  #  #  #  #  #  # ##  #  #  ####  # ##
    // # ##  #  #  #  #  #  #  # ##  #  #  ##
    //  # #   ###   ###   ###   # #  #  #   ##
    /**
     * Adds a game to the database.
     * @param {string} game The name of the game.
     * @param {string} code The short code of the game.
     * @returns {Promise} A promise that resolves when the game has been added.
     */
    static addGame(game, code) {
        return db.query("insert into game (game, code) values (@game, @code)", {
            game: {type: Db.VARCHAR(255), value: game},
            code: {type: Db.VARCHAR(50), value: code}
        });
    }

    //    #        ##           #           ##                     ###          ##            #
    //    #         #           #          #  #                    #  #        #  #           #
    //  ###   ##    #     ##   ###    ##   #      ###  # #    ##   ###   #  #  #      ##    ###   ##
    // #  #  # ##   #    # ##   #    # ##  # ##  #  #  ####  # ##  #  #  #  #  #     #  #  #  #  # ##
    // #  #  ##     #    ##     #    ##    #  #  # ##  #  #  ##    #  #   # #  #  #  #  #  #  #  ##
    //  ###   ##   ###    ##     ##   ##    ###   # #  #  #   ##   ###     #    ##    ##    ###   ##
    //                                                                    #
    /**
     * Deletes a game by its short code.
     * @param {string} code The short code of the game.
     * @returns {Promise} A promise that resolves when the game has been deleted.
     */
    static deleteGameByCode(code) {
        return db.query("delete from game where code = @code", {code: {type: Db.VARCHAR(50), value: code}});
    }

    //              #     ##
    //              #    #  #
    //  ###   ##   ###   #      ###  # #    ##    ###
    // #  #  # ##   #    # ##  #  #  ####  # ##  ##
    //  ##   ##     #    #  #  # ##  #  #  ##      ##
    // #      ##     ##   ###   # #  #  #   ##   ###
    //  ###
    /**
     * Gets the games from the database.
     * @returns {Promise<Array<{game: string, code: string}>>} A promise that resolves with the list of games.
     */
    static getGames() {
        return db.query("select game, code from game order by code").then((data) => data && data.recordsets && data.recordsets[0]);
    }

    //         #                                        ####         #            #           ###         ###    #                                #
    //         #                                        #                         #           #  #        #  #                                    #
    //  ###   ###   ###    ##    ###  # #    ##   ###   ###   #  #  ##     ###   ###    ###   ###   #  #  #  #  ##     ###    ##    ##   ###    ###
    // ##      #    #  #  # ##  #  #  ####  # ##  #  #  #      ##    #    ##      #    ##     #  #  #  #  #  #   #    ##     #     #  #  #  #  #  #
    //   ##    #    #     ##    # ##  #  #  ##    #     #      ##    #      ##    #      ##   #  #   # #  #  #   #      ##   #     #  #  #     #  #
    // ###      ##  #      ##    # #  #  #   ##   #     ####  #  #  ###   ###      ##  ###    ###     #   ###   ###   ###     ##    ##   #      ###
    //                                                                                               #
    /**
     * Gets whether a streamer exists by their Discord ID.
     * @param {string} discord The Discord ID.
     * @returns {Promise<boolean>} A promise that resolves with whether the streamer exists.
     */
    static streamerExistsByDiscord(discord) {
        return db.query("select top 1 1 found from streamer where discord = @discord", {discord: {type: Db.VARCHAR(50), value: discord}}).then((data) => !!(data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].found === 1));
    }

    //          #     #   ##    #
    //          #     #  #  #   #
    //  ###   ###   ###   #    ###   ###    ##    ###  # #    ##   ###
    // #  #  #  #  #  #    #    #    #  #  # ##  #  #  ####  # ##  #  #
    // # ##  #  #  #  #  #  #   #    #     ##    # ##  #  #  ##    #
    //  # #   ###   ###   ##     ##  #      ##    # #  #  #   ##   #
    /**
     * Adds a streamer to the database.
     * @param {string} streamer The name of the streamer.
     * @param {string} discord The streamer's Discord ID.
     * @returns {Promise} A promise that resolves when the streamer has been added to the database.
     */
    static addStreamer(streamer, discord) {
        return db.query("insert into streamer (streamer, discord) values (@streamer, @discord)", {
            streamer: {type: Db.VARCHAR(50), value: streamer},
            discord: {type: Db.VARCHAR(50), value: discord}
        });
    }

    //              #     ##    #
    //              #    #  #   #
    //  ###   ##   ###    #    ###   ###    ##    ###  # #    ##   ###    ###
    // #  #  # ##   #      #    #    #  #  # ##  #  #  ####  # ##  #  #  ##
    //  ##   ##     #    #  #   #    #     ##    # ##  #  #  ##    #       ##
    // #      ##     ##   ##     ##  #      ##    # #  #  #   ##   #     ###
    //  ###
    /**
     * Gets the streamers from the database.
     * @returns {Promise<Array<{streamer: string, discord: string}>>} A promise that resolves with the list of streamers.
     */
    static getStreamers() {
        return db.query("select streamer, discord from streamer").then((data) => data && data.recordsets && data.recordsets[0]);
    }

    //              #     ##    #                                                ##            #  #  #                #
    //              #    #  #   #                                               #  #           #  #  #                #
    //  ###   ##   ###    #    ###   ###    ##    ###  # #    ##   ###    ###   #  #  ###    ###  ####   ##    ###   ###    ###
    // #  #  # ##   #      #    #    #  #  # ##  #  #  ####  # ##  #  #  ##     ####  #  #  #  #  #  #  #  #  ##      #    ##
    //  ##   ##     #    #  #   #    #     ##    # ##  #  #  ##    #       ##   #  #  #  #  #  #  #  #  #  #    ##    #      ##
    // #      ##     ##   ##     ##  #      ##    # #  #  #   ##   #     ###    #  #  #  #   ###  #  #   ##   ###      ##  ###
    //  ###
    /**
     * Gets the names of the streamers and hosts from the database.
     * @returns {Promise<{streamers: string[], hosts: string[]}>} A promise that resolves with the names of the streamers and hosts.
     */
    static getStreamersAndHosts() {
        return db.query("select streamer from streamer; select streamer from host").then((data) => data && data.recordsets && data.recordsets[0] && data.recordsets[1] && {streamers: data.recordsets[0].map((row) => row.streamer), hosts: data.recordsets[1].map((row) => row.streamer)});
    }
}

module.exports = Database;
