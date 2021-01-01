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

// Capitalizes first letter of each word
function capitalize(string) {
  return string.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Removes symbols and converts to lowercase
function removeSpecial(string) {
  let arr = string.toLowerCase().replaceAll('\n', ' ').replaceAll('-', ' ').replaceAll('_', ' ').split('');
  let index = 0;
  let lastIndex = arr.length - 1;

  while (index <= lastIndex) {
    if ('`~!@#$%^&*()-_=+[{]}\\|;:\'",<.>/?'.includes(arr[index])) {
      arr.splice(index, 1);
      lastIndex--;
    } else {
      index++;
    }
  }

  return arr.join('');
}

// Subfunction that generates message given user and optional desired first word
function generate(user, firstWord = '') {
  let string = '';
  // Stores next word to concatenate to string; random word in firstWords by default
  let word = users[user].firstWords[Math.floor(Math.random() * users[user].firstWords.length)];
  // Sets word to a specific word if the user has sent some form of firstWord in the past
  if (firstWord != '') {
    let targetWords = Object.keys(users[user].words);
    // Checks for exact matches first
    let succeeded = false;
    for (const targetWord of targetWords) {
      if (firstWord == targetWord) {
        word = targetWord;
        succeeded = true;
        break;
      }
    }
    if (!succeeded) {
      for (const targetWord of targetWords) {
        if (removeSpecial(firstWord) == removeSpecial(targetWord)) {
          word = targetWord;
          break;
        }
      }
    }
  }

  // Generates message with Markov chain until it ends naturally or reaches a length limit
  let length = 0;
  while (word != 'LAST_WORD' && length < 100) {
    string += word + ' ';
    word = users[user].words[word][Math.floor(Math.random() * users[user].words[word].length)];
    length++;
  }

  return string;
}

// Function that takes an array of words and tries to create a message from them using a user
function userTalk(user, words) {
  let string = '';

  // Tries words from left to right
  for (const word of words) {
    // Returns string if it starts with the word
    string = generate(user, word);
    if (removeSpecial(word) == removeSpecial(string.split(' ')[0])) {
      return `**${capitalize(user)}:\n**` + string;
    }
  }

  // Returns something anyways even if it doesn't start with a target word
  return `**${capitalize(user)}:\n**` + string;
}

// Function that takes an array of words and tries to create a message from them using any user
function anyTalk(words) {
  let string = '';
  let user = '';

  // Tries words from left to right
  for (const word of words) {
    let possibleUsers = Object.keys(users);
    while (possibleUsers.length > 0) {
      // Picks random user
      user = possibleUsers[Math.floor(Math.random() * possibleUsers.length)];
      possibleUsers.pop(possibleUsers.indexOf(user));

      // Returns string if it starts with the word
      string = generate(user, word);
      if (removeSpecial(word) == removeSpecial(string.split(' ')[0])) {
        return `**${capitalize(user)}:\n**` + string;
      }
    }
  }

  // Returns something anyways even if it doesn't start with a target word
  return `**${capitalize(user)}:\n**` + string;
}

// Function that takes an array of words and tries to create a message from them for all users
function allTalk(words) {
  let string = '';

  for (const user of Object.keys(users)) {
    let subString = '';

    let succeeded = false;
    for (const word of words) {
      subString = generate(user, word);
      // Concatenates subString to string if it starts with the word
      if (removeSpecial(word) == removeSpecial(subString.split(' ')[0])) {
        string += `\n\n**${capitalize(user)}:\n**` + subString;
        succeeded = true;
        break;
      }
    }

    // Concatenates subString to string anyways even if it doesn't start with a target word
    if (!succeeded) {
      string += `\n\n**${capitalize(user)}:\n**` + subString;
    }
  }

  return string;
}

// Discord bot section

const discord = require('discord.js');
const { SSL_OP_NETSCAPE_REUSE_CIPHER_CHANGE_BUG } = require('constants');
const client = new discord.Client();

// Generates r!help message
let helpMessage = '**Commands:**\nr!help\nr!talk\nr!alltalk';
for (const user of Object.keys(users)) {
  helpMessage += `\nr!${user}`;
}
let invalidMessage = 'Invalid command. Enter r!help for a list of commands.';

// Runs when bot starts up
client.on('ready', () => {
  console.log(`Online: ${client.user.tag}`);
});

// Runs every time a new message is posted
client.on('message', msg => {
  try {
    // Ignores bot's own messages
    if (msg.author.id != '794336786415091782') {
      const msgArr = msg.content.toLowerCase().split(' ');
      msgArr.push('');

      // If message is a bot command
      if (msgArr[0].slice(0, 2) == 'r!') {
        if (msgArr[0] == ('r!help')) {
          msg.channel.send(helpMessage);

        } else if (msgArr[0] == ('r!talk')) {
          msg.channel.send(anyTalk(msgArr.slice(1, 11)));

        } else if (msgArr[0] == ('r!alltalk')) {
          msg.channel.send(allTalk(msgArr.slice(1, 11)));

        // Specific user commands and invalid command
        } else {
          let invalidCommand = true;

          for (const user of Object.keys(users)) {
            if (msgArr[0] == (`r!${user}`)) {
              msg.channel.send(userTalk(user, msgArr.slice(1, 11)));
              invalidCommand = false;
              break;
            }
          }

          if (invalidCommand) {
            msg.channel.send(invalidMessage);
          }
        }
      }
    }

  } catch (e) {
    console.log(e);
  }
});

client.login(require('./bot_token.json').token);