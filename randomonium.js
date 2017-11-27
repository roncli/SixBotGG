const owHeroes = [
    "Genji",
    "McCree",
    "Pharah",
    "Reaper",
    "Soldier: 76",
    "Tracer",
    "Bastion",
    "Hanzo",
    "Junkrat",
    "Mei",
    "Torbj\xf6rn",
    "Widowmaker",
    "D.Va",
    "Reinhardt",
    "Roadhog",
    "Winston",
    "Zarya",
    "L\xfacio",
    "Mercy",
    "Symmetra",
    "Zenyatta",
    "Ana",
    "Sombra",
    "Orisa",
    "Doomfist",
    "Moira"
];

//  ####                     #                                #
//  #   #                    #
//  #   #   ###   # ##    ## #   ###   ## #    ###   # ##    ##    #   #  ## #
//  ####       #  ##  #  #  ##  #   #  # # #  #   #  ##  #    #    #   #  # # #
//  # #     ####  #   #  #   #  #   #  # # #  #   #  #   #    #    #   #  # # #
//  #  #   #   #  #   #  #  ##  #   #  # # #  #   #  #   #    #    #  ##  # # #
//  #   #   ####  #   #   ## #   ###   #   #   ###   #   #   ###    ## #  #   #
/**
 * A class to handle the Overwatch randomonium character generator.
 */
class Randomonium {
    //              #    #  #
    //              #    #  #
    //  ###   ##   ###   ####   ##   ###    ##    ##    ###
    // #  #  # ##   #    #  #  # ##  #  #  #  #  # ##  ##
    //  ##   ##     #    #  #  ##    #     #  #  ##      ##
    // #      ##     ##  #  #   ##   #      ##    ##   ###
    //  ###
    /**
     * Gets a list of heroes.
     * @param {number} count The number of heroes to return.
     * @param {boolean} dupes Whether to return duplicate heroes or not.
     * @returns {string[]} The list of heroes.
     */
    static getHeroes(count, dupes) {
        const heroes = [];

        owHeroes.sort(() => Math.random() - 0.5);

        for (let index = 0; index < count; index++) {
            heroes.push(owHeroes[index]);
            if (dupes) {
                owHeroes.sort(() => Math.random() - 0.5);
            }
        }

        return heroes;
    }
}

module.exports = Randomonium;
