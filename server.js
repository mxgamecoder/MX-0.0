const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const port = 3000;

// Serve static files from jest, nsfw, and fun folders
app.use('/web', express.static(path.join(__dirname, 'web')));
app.use('/db', express.static(path.join(__dirname, 'db')));
app.use('/STYLE', express.static(path.join(__dirname, 'STYLE')));
app.use('/JAVASCRIPT', express.static(path.join(__dirname, 'JAVASCRIPT')));
app.use('/audio', express.static(path.join(__dirname, 'audio')));
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
      res.json({
        success: true,
        message: "Image fetched successfully.",
        imageUrl: `${folderUrl}/${randomImage}`
      });
    } catch (err) {
      console.error(`Error accessing ${folderUrl} folder:`, err.message);
      res.status(500).send(`Error accessing the ${folderUrl} folder.`);
    }
  };
}

// Routes for all jest categories without `/random-image`
const jestCategories = [
  '8ball', 'avatar', 'cuddle', 'feed', 'fox_girl', 'gasm', 'gecy', 
  'goose', 'hug', 'kiss', 'lewd', 'lizard', 'meow', 'ngif', 'pat', 
  'slap', 'smug', 'spank', 'tickle', 'wallpaper', 'woof'
];

jestCategories.forEach(category => {
  app.get(`/jest/${category}`, serveRandomImage(`jest/${category}`, `/jest/${category}`));
});

// Show available categories for /jest
app.get('/jest', (req, res) => {
  res.json({
    success: true,
    message: "Available jest categories.",
    categories: jestCategories
  });
});

// Routes for all nsfw categories without `/random-image`
const nsfwCategories = ['neko', 'waifu', 'shemale', 'blowjob'];

nsfwCategories.forEach(category => {
  app.get(`/nsfw/${category}`, serveRandomImage(`nsfw/${category}`, `/nsfw/${category}`));
});

// Show available categories for /nsfw
app.get('/nsfw', (req, res) => {
  res.json({
    success: true,
    message: "Available nsfw categories.",
    categories: nsfwCategories
  });
});

// Import the categories from the fun folder
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

// Dynamic routes for fun folder categories
const funCategories = {
  joke: jokes,
  fact: facts,
  quote: quotes,
  truth: truths,
  dare: dares,
  riddle: riddles,
  compliment: compliments,
  whatIf: funnyQuotes,
  wouldYourather: wouldYourathers,
  tongueTwister: tongueTwisters,
  quotesfunny: quotesfunnys,
  knockknock: knockKnockJokes,
  limericks: limericks,
  pickuplines: pickuplines,
  puns: puns
};

Object.entries(funCategories).forEach(([key, values]) => {
  app.get(`/fun/${key}`, (req, res) => {
    const randomIndex = Math.floor(Math.random() * values.length);
    res.json({
      success: true,
      message: `${key.charAt(0).toUpperCase() + key.slice(1)} fetched successfully.`,
      content: values[randomIndex]
    });
  });
});

// Show available categories for /fun
app.get('/fun', (req, res) => {
  res.json({
    success: true,
    message: "Available fun categories.",
    categories: Object.keys(funCategories)
  });
});

// Serve login.html directly
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'login.html'));
});

// Serve the index.html file on the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
