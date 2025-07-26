const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const requireApiKey = require('./middleware/apiKey');
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://mxgamecoder-klfx.onrender.com',
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

app.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: "Welcome to MXAPI 🌍",
    usage: "To use protected routes like /jest, /nsfw, /fun, etc., add your API key in the URL like this:",
    example: "https://mxgamecoder-klfx.onrender.com/jest/hug?meka=meka_YourApiKeyHere",
    tip: "Get your API key by logging into the dashboard and clicking 'API Key' on the sidebar."
  });
});
// ========== Auth Routes ==========
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));

// ========== Static Files ==========
app.use('/jest', express.static(path.join(__dirname, 'jest')));
app.use('/nsfw', express.static(path.join(__dirname, 'nsfw')));
app.use('/fun', express.static(path.join(__dirname, 'fun')));
app.use('/theend', express.static(path.join(__dirname, 'theend')));

// ======== apikey ===============
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next(); // Allow open access to auth/user routes
  }

  // Apply API key middleware to all others
  return requireApiKey(req, res, next);
});

// ========== Random Image Logic ==========
function serveRandomImage(folderPath, folderUrl) {
  return (req, res) => {
    const dirPath = path.join(__dirname, folderPath);
    try {
      const images = fs.readdirSync(dirPath)
        .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
        .sort((a, b) => {
          if (a.endsWith('.gif') && !b.endsWith('.gif')) return -1;
          if (!a.endsWith('.gif') && b.endsWith('.gif')) return 1;
          return 0;
        });

      if (images.length === 0) {
        return res.status(404).send(`No images found in the "${folderUrl}" folder.`);
      }

      const randomImage = images[Math.floor(Math.random() * images.length)];
      const imageUrl = `${req.protocol}://${req.get('host')}${folderUrl}/${randomImage}`;

      res.json({
        success: true,
        message: "Image fetched successfully.",
        imageUrl
      });
    } catch (err) {
      console.error(`Error accessing ${folderUrl} folder:`, err.message);
      res.status(500).send(`Error accessing the ${folderUrl} folder.`);
    }
  };
}

// ========== JEST CATEGORIES ==========
const jestCategories = [
  '8ball', 'avatar', 'cuddle', 'feed', 'fox_girl', 'gasm', 'gecg', 
  'goose', 'hug', 'kiss', 'lewd', 'lizard', 'meow', 'ngif', 'pat', 
  'slap', 'smug', 'spank', 'tickle', 'wallpaper', 'woof'
];

jestCategories.forEach(category => {
  app.get(`/jest/${category}`, serveRandomImage(`jest/${category}`, `/jest/${category}`));
});
app.get('/jest', (req, res) => {
  res.json({ success: true, message: "Available jest categories.", categories: jestCategories });
});

// ========== NSFW CATEGORIES ==========
const nsfwCategories = ['neko', 'waifu', 'shemale', 'blowjob'];
nsfwCategories.forEach(category => {
  app.get(`/nsfw/${category}`, serveRandomImage(`nsfw/${category}`, `/nsfw/${category}`));
});
app.get('/nsfw', (req, res) => {
  res.json({ success: true, message: "Available nsfw categories.", categories: nsfwCategories });
});

// ========== FUN CATEGORIES ==========
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
app.get('/fun', (req, res) => {
  res.json({ success: true, message: "Available fun categories.", categories: Object.keys(funCategories) });
});

// ========== AI ROUTE ==========
app.post('/theend/ai', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ success: false, error: "Prompt is required." });
  }

  try {
    const reply = await getAIResponse(prompt); // Make sure getAIResponse is defined
    res.json({ success: true, message: "AI response generated successfully.", prompt, reply });
  } catch (err) {
    console.error("AI error:", err.message);
    res.status(500).json({ success: false, error: "Failed to generate AI response." });
  }
});
app.get('/theend', (req, res) => {
  res.json({ success: true, message: "Available theend categories.", categories: ['ai'] });
});

// ========== Serve index.html ==========
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.use(express.static(path.join(__dirname, 'public')));

// ========== Start Server ==========
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
