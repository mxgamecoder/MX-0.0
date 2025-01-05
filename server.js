const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const port = 3000;

// Serve static files from jest, nsfw, and fun folders
app.use('/jest', express.static(path.join(__dirname, 'jest')));
app.use('/nsfw', express.static(path.join(__dirname, 'nsfw')));
app.use('/fun', express.static(path.join(__dirname, 'fun')));

// Utility function to serve random images from a given folder
function serveRandomImage(folderPath, folderUrl) {
  return (req, res) => {
    const dirPath = path.join(__dirname, folderPath);
    console.log(`Looking for images in: ${dirPath}`); // Debugging line

    try {
      const images = fs.readdirSync(dirPath).filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));
      
      if (images.length === 0) {
        return res.status(404).send(`No images found in the "${folderUrl}" folder.`);
      }
      
      const randomImage = images[Math.floor(Math.random() * images.length)];
      res.send(`${folderUrl}/${randomImage}`);
    } catch (err) {
      console.error(`Error accessing ${folderUrl} folder:`, err.message);
      res.status(500).send(`Error accessing the ${folderUrl} folder.`);
    }
  };
}

// Routes for all jest categories
app.get('/jest/8ball/random-image', serveRandomImage('jest/8ball', '/jest/8ball'));
app.get('/jest/avatar/random-image', serveRandomImage('jest/avatar', '/jest/avatar'));
app.get('/jest/cuddle/random-image', serveRandomImage('jest/cuddle', '/jest/cuddle'));
app.get('/jest/feed/random-image', serveRandomImage('jest/feed', '/jest/feed'));
app.get('/jest/fox_girl/random-image', serveRandomImage('jest/fox_girl', '/jest/fox_girl'));
app.get('/jest/gasm/random-image', serveRandomImage('jest/gasm', '/jest/gasm'));
app.get('/jest/gecy/random-image', serveRandomImage('jest/gecy', '/jest/gecy'));
app.get('/jest/goose/random-image', serveRandomImage('jest/goose', '/jest/goose'));
app.get('/jest/hug/random-image', serveRandomImage('jest/hug', '/jest/hug'));
app.get('/jest/kiss/random-image', serveRandomImage('jest/kiss', '/jest/kiss'));
app.get('/jest/lewd/random-image', serveRandomImage('jest/lewd', '/jest/lewd'));
app.get('/jest/lizard/random-image', serveRandomImage('jest/lizard', '/jest/lizard'));
app.get('/jest/meow/random-image', serveRandomImage('jest/meow', '/jest/meow'));
app.get('/jest/ngif/random-image', serveRandomImage('jest/ngif', '/jest/ngif'));
app.get('/jest/pat/random-image', serveRandomImage('jest/pat', '/jest/pat'));
app.get('/jest/slap/random-image', serveRandomImage('jest/slap', '/jest/slap'));
app.get('/jest/smug/random-image', serveRandomImage('jest/smug', '/jest/smug'));
app.get('/jest/spank/random-image', serveRandomImage('jest/spank', '/jest/spank'));
app.get('/jest/tickle/random-image', serveRandomImage('jest/tickle', '/jest/tickle'));
app.get('/jest/wallpaper/random-image', serveRandomImage('jest/wallpaper', '/jest/wallpaper'));
app.get('/jest/woof/random-image', serveRandomImage('jest/woof', '/jest/woof'));

// Routes for all nsfw categories
app.get('/nsfw/neko/random-image', serveRandomImage('nsfw/neko', '/nsfw/neko'));
app.get('/nsfw/waifu/random-image', serveRandomImage('nsfw/waifu', '/nsfw/waifu'));
app.get('/nsfw/shemale/random-image', serveRandomImage('nsfw/shemale', '/nsfw/shemale'));
app.get('/nsfw/blowjob/random-image', serveRandomImage('nsfw/blowjob', '/nsfw/blowjob'));

// Import the categories
const jokes = require('./fun/joke');
const facts = require('./fun/fact');
const quotes = require('./fun/quote');
const truths = require('./fun/truth');
const dares = require('./fun/dare');
const riddles = require('./fun/riddle');
const compliments = require('./fun/compliment');
const funnyQuotes = require('./fun/whatIf');
const wouldYourathers = require('./fun/wouldYourather');
const tongueTwisters = require('./fun/tongueTwister');
const quotesfunnys = require('./fun/quotesfunny');
const knockKnockJokes = require('./fun/knockknock');
const limericks = require('./fun/limericks');
const pickuplines = require('./fun/pickuplines');
const puns = require('./fun/puns');

// Route to get a random puns
app.get('/puns', (req, res) => {
  const randomIndex = Math.floor(Math.random() * puns.length);
  res.send(puns[randomIndex]);
});


// Route to get a random pickuplines
app.get('/pickuplines', (req, res) => {
  const randomIndex = Math.floor(Math.random() * pickuplines.length);
  res.send(pickuplines[randomIndex]);
});

// Route to get a random limericks
app.get('/limericks', (req, res) => {
  const randomIndex = Math.floor(Math.random() * limericks.length);
  res.send(limericks[randomIndex]);
});

// Route to get a random knockknock
app.get('/knockknock', (req, res) => {
  const randomIndex = Math.floor(Math.random() * knockKnockJokes.length);
  res.send(knockKnockJokes[randomIndex]);
});


// Route to get a random tongueTwister
app.get('/tongueTwister', (req, res) => {
  const randomIndex = Math.floor(Math.random() * tongueTwisters.length);
  res.send(tongueTwisters[randomIndex]);
});

// Route to get a random quotesfunny
app.get('/quotesfunny', (req, res) => {
  const randomIndex = Math.floor(Math.random() * quotesfunnys.length);
  res.send(quotesfunnys[randomIndex]);
});


// Route to get a random whatIf
app.get('/whatIf', (req, res) => {
  const randomIndex = Math.floor(Math.random() * funnyQuotes.length);
  res.send(funnyQuotes[randomIndex]);
});

// Route to get a random wouldYourather
app.get('/wouldYourather', (req, res) => {
  const randomIndex = Math.floor(Math.random() * wouldYourathers.length);
  res.send(wouldYourathers[randomIndex]);
});

// Route to get a random joke
app.get('/joke', (req, res) => {
  const randomIndex = Math.floor(Math.random() * jokes.length);
  res.send(jokes[randomIndex]);
});

// Route to get a random fact
app.get('/fact', (req, res) => {
  const randomIndex = Math.floor(Math.random() * facts.length);
  res.send(facts[randomIndex]);
});

// Route to get a random quote
app.get('/quote', (req, res) => {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  res.send(quotes[randomIndex]);
});

// Route to get a random truth
app.get('/truth', (req, res) => {
  const randomIndex = Math.floor(Math.random() * truths.length);
  res.send(truths[randomIndex]);
});

// Route to get a random dare
app.get('/dare', (req, res) => {
  const randomIndex = Math.floor(Math.random() * dares.length);
  res.send(dares[randomIndex]);
});

// Route to get a random riddle
app.get('/riddle', (req, res) => {
  const randomIndex = Math.floor(Math.random() * riddles.length);
  res.send(riddles[randomIndex]);
});

// Route to get a random compliment
app.get('/compliment', (req, res) => {
  const randomIndex = Math.floor(Math.random() * compliments.length);
  res.send(compliments[randomIndex]);
});

// Serve the index.html file on the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
