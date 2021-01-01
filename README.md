# rick-bot

A personal Discord bot. The main feature right now is the ability to generate non-sensical text for each user using a Markov chain.

## How to Use:

Requires placing .json files generated using DiscordChatExporter in "chat_data/". The bot uses these files to generate the text.

Also requires creating the files "users.json" and "bot_token.json" in this folder.

"users.json" specifies the user-specific commands to be generated and the IDs that they will be based on:

    {
        "name1": {
            "ids": [
                "1234567890"
            ]
        },
        "name2": {
            "ids": [
                "2345678901",
                "3456789012"
            ]
        },
        ...
    }

"bot_token.json" specifies the bot's token, which should never be shared publicly:

    {
      "token": "1234567890"
    }

Additionally, IDs of users that the bot will ignore can be added in "blacklist.json":

    {
        "ids": [
            "0987654321"
        ]
    }