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
      const images = fs.readdirSync(dirPath)
        .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file)) // Make sure to include gif files
        .sort((a, b) => {
          // Prioritize gifs over jpgs
          if (a.endsWith('.gif') && !b.endsWith('.gif')) return -1;
          if (!a.endsWith('.gif') && b.endsWith('.gif')) return 1;
          return 0;
        });

      if (images.length === 0) {
        return res.status(404).send(`No images found in the "${folderUrl}" folder.`);
      }

      const randomImage = images[Math.floor(Math.random() * images.length)];
      const imageUrl = `${folderUrl}/${randomImage}`;
      const imagePath = path.join(dirPath, randomImage);

      // Read the image file and set the correct MIME type
      fs.readFile(imagePath, (err, data) => {
        if (err) {
          console.error(`Error reading image:`, err.message);
          return res.status(500).send(`Error accessing the ${folderUrl} folder.`);
        }

        let contentType;
        if (randomImage.endsWith('.gif')) {
          contentType = 'image/gif';
        } else if (randomImage.endsWith('.jpg') || randomImage.endsWith('.jpeg')) {
          contentType = 'image/jpeg';
        } else if (randomImage.endsWith('.png')) {
          contentType = 'image/png';
        } else {
          return res.status(400).send('Unsupported image format.');
        }

        res.set('Content-Type', contentType);
        res.send(data);
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

// Serve the index.html file on the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
