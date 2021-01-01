// User data generation section

const fs = require('fs');
let users = require('./users.json');

// For each user, generates the following properties: words, wordsLength, firstWords
for (const user of Object.keys(users)) {
  // Gets messages from the user
  let messages = [];

  fs.readdirSync('./chat_data/').forEach(file => {
    if (file.split('.')[file.split('.').length - 1].toLowerCase() == 'json') {
      let chatData = require(`./chat_data/${file}`);
      let numMessages = chatData.messageCount;
  
      for (let j = 0; j < numMessages; j++) {
        if (users[user].ids.includes(chatData.messages[j].author.id)) {
          messages.push(chatData.messages[j].content);
        }
      }
    }
  });

  // Stores words as an object where each key is a word and each value is an array with all words that follow it
  users[user].words = {};
  // Number of words in words
  users[user].wordsLength = 0;

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i].split(' ');

    for (let j = 0; j < message.length - 1; j++) {
      if (!(message[j] in users[user].words)) {
        users[user].words[message[j]] = [];
        users[user].wordsLength++;
      }

      users[user].words[message[j]].push(message[j + 1]);
    }

    if (!(message[message.length - 1] in users[user].words)) {
      users[user].words[message[message.length - 1]] = [];
      users[user].wordsLength++;
    }

    users[user].words[message[message.length - 1]].push('LAST_WORD');
  }

  // Stores first words used in messages as array
  users[user].firstWords = [];

  for (let i = 0; i < messages.length; i++) {
    users[user].firstWords.push(messages[i].split(' ')[0]);
  }
}

// Function that generates message
function generate(user, name, firstWord = '', maxLength = 100) {
  let word = firstWord;
  if (word == '') {
    word = user.firstWords[Math.floor(Math.random() * user.firstWords.length)];
  }
  let length = 0;
  let string = '';

  while (word != 'LAST_WORD' && length < maxLength) {
    string += word + ' ';
    word = user.words[word][Math.floor(Math.random() * user.words[word].length)];
    length++;
  }

  return `**${name.charAt(0).toUpperCase() + name.slice(1)}:**\n` + string;
}

// Function that takes an array of words and tries to create a message from them, using any user
function talk(words) {
  let possibleUsers = Object.keys(users);

  for (const word of words) {
    for (let i = 0; i < Object.keys(users).length; i++) {
      let user = possibleUsers[Math.floor(Math.random() * possibleUsers.length)];
      possibleUsers.pop(possibleUsers.indexOf(user));

      let targetWords = Object.keys(users[user].words);

      for (const targetWord of targetWords) {
        if (word == targetWord.toLowerCase()) {
          return generate(users[user], user, targetWord);
        }
      }
    }
  }

  let user = Object.keys(users)[Math.floor(Math.random() * Object.keys(users).length)];
  return generate(users[user], user);
}

// Discord bot section

const discord = require('discord.js');
const { SSL_OP_NETSCAPE_REUSE_CIPHER_CHANGE_BUG } = require('constants');
const client = new discord.Client();

// Generates r!help message
let helpMessage = '**Commands:**\nr!help\nr!talk [word(s)]';
for (const user of Object.keys(users)) {
  helpMessage += `\nr!${user}`;
}

// Runs when bot starts up
client.on('ready', () => {
  console.log(`Logged In: ${client.user.tag}`);
});

// Runs every time a new message is posted
client.on('message', msg => {
  try {
    // Ignores bot's own messages
    if (msg.author.id != '794336786415091782') {
      const msgStr = msg.content.toLowerCase();

      // If message is a bot command
      if (msgStr.slice(0, 2) == 'r!') {
        // Help command
        if (msgStr.split(' ')[0] == ('r!help')) {
          msg.channel.send(helpMessage);

        // Talk command
        } else if (msgStr.split(' ')[0] == ('r!talk')) {
          msg.channel.send(talk(msgStr.split(' ').slice(1)));

        // Specific user commands
        } else {
          let invalidCommand = true;

          for (const user of Object.keys(users)) {
            if (msgStr.split(' ')[0] == (`r!${user}`)) {
              msg.channel.send(generate(users[user], user));
              invalidCommand = false;
              break;
            }
          }

          // Invalid command
          if (invalidCommand) {
            msg.channel.send('Invalid command. Enter r!help for a list of commands.');
          }
        }
      }
    }

  } catch (e) {
    console.log(e);
  }
});

client.login(require('./bot_token.json').token);