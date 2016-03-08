SixBotGG
========

This is the source repository for the [Six Gaming Twitch Channel](http://twitch.tv/sixgaminggg) chat bot known as [SixBotGG](http://twitch.tv/sixbotgg).  This bot is written in [node.js](http://nodejs.org).

Installation
============

1. Install the node modules from the base directory (ignore errors and warnings on Windows):

        npm install
 
2. Create the settings.js file in the root directory as indicated below.
3. Run the following command from the base directory:

        node index.js

settings.js
===========

The following should be the contents of settings.js:

        module.exports = {
            irc: {
                server: "irc.twitch.tv",
                nick: "(The nickname of the bot you wish to log in as)",
                options: {
                    userName: "(The nickname of the bot, properly capitalized)",
                    realName: "(A long name for the bot)",
                    port: 6667,
                    password: "(The oauth key to log into, retrieved from Twitch)",
                    autoConnect: false
                }
            },
            twitch: {
                clientId: "(Your client ID, retrieved from your Twitch connected app)",
                clientSecret: "(Your client secret, retrieved from your Twitch connected app)",
                redirectUri: "(Your redirect URI from your Twitch connected app)",
                scopes: []
            }
        };

Version History
===============

1.0.1 - 3/7/2016
----------------

This is a bug fix release.

* Do not greet SixBotGG or SixGamingGG in chat.
* Do not assume people have been unmodded, and do not greet if they were already modding.
* Check if `response` is an object before trying to check the `stream` object. 

1.0.0 - 3/2/2016
----------------

This is the initial release of the SixBotGG chat bot.

* Auto logs into Twitch and enters the #sixgaminggg chat
* Recognizes the !facebook, !twitter, !youtube, and !itunes commands from all users.
* Auto-cycles through the above four commands when both 10 minutes and 5 chat messages have occurred.
* Recognizes the !host <user> and !unhost commands from moderators.
* Automatically cycles every 10 minutes through hosting a select list of streamers when SixGamingGG is offline.
* Hosts someone else when the currently hosted client's stream ends.
* Stops hosting when manually hosting another streamer, or SixGamingGG starts streaming.
