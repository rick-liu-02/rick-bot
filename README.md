# rick-bot

A personal Discord bot. The main feature right now is the ability to generate non-sensical text for each user using a Markov chain.

## How to Use:

Requires creating the files "users.json" and "bot_token.json" in the root folder.

"users.json" should be of the form:

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

"bot_token.json" should be of the form:

    {
      "token": "1234567890"
    }

Also requires placing .json files generated using DiscordChatExporter in "chat_data/".
