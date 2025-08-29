const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const requireApiKey = require('./middleware/apiKey');
const checkUsage = require('./middleware/checkUsage');
const Usage = require('./models/Usage');
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const allowedOrigins = [
  'https://mxapi-lnc.onrender.com',
  'https://f1277a31-82ea-4b2c-9e22-fa1e4197a39d-00-1falu0he0oln1.riker.replit.dev',
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
app.get('/status-check/:type/:category', async (req, res) => {
  const { type, category } = req.params;

  const validMap = {
    fun: Object.keys(funCategories),
    jest: jestCategories,
    nsfw: nsfwCategories,
    theend: ['ai']
  };

  if (!validMap[type] || !validMap[type].includes(category)) {
    return res.status(404).json({ success: false, message: "Endpoint not found" });
  }

  res.json({ success: true, message: "Endpoint available" });
});
// ========== Auth Routes ==========
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
const supportRoute = require('./routes/support');
app.use('/api/support', supportRoute);
const marketplaceRoutes = require('./routes/marketplace');
app.use('/api/marketplace', marketplaceRoutes);
// ========== Static Files ==========
app.use('/jest', express.static(path.join(__dirname, 'jest')));
app.use('/nsfw', express.static(path.join(__dirname, 'nsfw')));
app.use('/fun', express.static(path.join(__dirname, 'fun')));
app.use('/theend', express.static(path.join(__dirname, 'theend')));

// ======== apikey ===============
// Protect only /jest, /nsfw, /fun, and /theend
// 🚫 Don't check API key for category list like /fun, /jest, /nsfw
app.get('/fun', (req, res) => {
  res.json({ success: true, message: "Available fun categories.", categories: Object.keys(funCategories) });
});
app.get('/jest', (req, res) => {
  res.json({ success: true, message: "Available jest categories.", categories: jestCategories });
});
app.get('/nsfw', (req, res) => {
  res.json({ success: true, message: "Available nsfw categories.", categories: nsfwCategories });
});
app.get('/theend', (req, res) => {
  res.json({ success: true, message: "Available theend categories.", categories: ['ai'] });
});

// ✅ Now protect only the real API usage like /fun/joke, /jest/hug etc
app.use(['/fun/:category', '/jest/:category', '/nsfw/:category', '/theend/:category'], requireApiKey, checkUsage);
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
/*app.get('/jest', (req, res) => {
  res.json({ success: true, message: "Available jest categories.", categories: jestCategories });
});
*/
// ========== NSFW CATEGORIES ==========
const nsfwCategories = ['neko', 'waifu', 'shemale', 'blowjob'];
nsfwCategories.forEach(category => {
  app.get(`/nsfw/${category}`, serveRandomImage(`nsfw/${category}`, `/nsfw/${category}`));
});
/*app.get('/nsfw', (req, res) => {
  res.json({ success: true, message: "Available nsfw categories.", categories: nsfwCategories });
});
*/
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
/*app.get('/fun', (req, res) => {
  res.json({ success: true, message: "Available fun categories.", categories: Object.keys(funCategories) });
});
*/
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

function autoMonthlyReset() {
  let alreadyResetToday = false;

  setInterval(async () => {
    const now = new Date();
    const day = now.getDate();
    const hour = now.getHours();

    if (day === 2 && !alreadyResetToday) {
      try {
        const usages = await Usage.find({});
        for (const usage of usages) {
          usage.count = 0;
          usage.storage = 0;
          usage.lastReset = new Date();
          await usage.save();
        }

        console.log(`🔁 Monthly usage reset done on ${now.toDateString()}`);
        alreadyResetToday = true; // Prevent multiple resets
      } catch (err) {
        console.error('❌ Monthly reset failed:', err.message);
      }
    }

    // Reset the reset flag after the 2nd
    if (day !== 2 && alreadyResetToday) {
      alreadyResetToday = false;
    }

  }, 1000 * 60 * 60); // Run every hour
}

autoMonthlyReset(); // Call it when server starts
