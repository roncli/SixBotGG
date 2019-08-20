const DiscordJs = require("discord.js");

//  #   #
//  #   #
//  #   #   ###    ###   # ##
//  #   #  #      #   #  ##  #
//  #   #   ###   #####  #
//  #   #      #  #      #
//   ###   ####    ###   #
/**
 * A class representing a Discord or Tmi user.
 */
class User {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Creates a new user.
     * @param {string|DiscordJs.GuildMember} user The user.
     */
    constructor(user) {
        this.user = user;
    }

    //    #   #                                #
    //    #                                    #
    //  ###  ##     ###    ##    ##   ###    ###
    // #  #   #    ##     #     #  #  #  #  #  #
    // #  #   #      ##   #     #  #  #     #  #
    //  ###  ###   ###     ##    ##   #      ###
    /**
     * Returns the Discord user.
     * @returns {DiscordJs.GuildMember} The Discord user.
     */
    get discord() {
        return this.user instanceof DiscordJs.GuildMember ? this.user : void 0;
    }

    //  #           #
    //  #
    // ###   # #   ##
    //  #    ####   #
    //  #    #  #   #
    //   ##  #  #  ###
    /**
     * Returns the Tmi user.
     * @returns {string} The Tmi user.
     */
    get tmi() {
        return typeof this.user === "string" ? this.user : void 0;
    }

    //  #           ##    #           #
    //  #          #  #   #
    // ###    ##    #    ###   ###   ##    ###    ###
    //  #    #  #    #    #    #  #   #    #  #  #  #
    //  #    #  #  #  #   #    #      #    #  #   ##
    //   ##   ##    ##     ##  #     ###   #  #  #
    //                                            ###
    /**
     * Returns a string representation of the user.
     * @returns {string} Returns the user name.
     */
    toString() {
        return `${this.user}`;
    }
}

module.exports = User;
