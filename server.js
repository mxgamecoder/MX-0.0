const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const port = 3000;

// Serve static files from jest, nsfw, and fun folders
app.use('/public', express.static(path.join(__dirname, 'public')));
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


// login and signup system
// Initialize Express
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Set up session middleware
app.use(session({
  secret: '7e9b0106f63b5898088364e61511a6704bb6277b565e7f59595d00b0c945e5d6', // A secret key to encrypt the session
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set 'secure: true' if using HTTPS
}));

// MongoDB Connection
mongoose.connect('mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority&ssl=true', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// User Model with phone number
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  fullname: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true, unique: true }, // New phone number field
});

const User = mongoose.model('User', userSchema);

// Signup Route
app.post('/signup', async (req, res) => {
  const { username, fullname, password, email, phoneNumber } = req.body;

  // Validate input
  const usernameRegex = /^[a-zA-Z0-9]{5,}$/;
  const fullnameRegex = /^[A-Z][a-z]{5,}$/;
  const phoneRegex = /^\+?[1-9]\d{1,14}$/; // Validates phone number format

  let errors = {};

  if (!username || !fullname || !password || !email || !phoneNumber) {
    return res.json({ success: false, message: 'All fields are required.' });
  }

  if (!fullnameRegex.test(fullname)) {
    errors.fullnameError = 'Name must start with one capital letter, followed by at least 5 lowercase letters.';
  }

  if (!usernameRegex.test(username)) {
    errors.usernameError = 'Username must be at least 5 characters long and contain only numbers and letters.';
  }

  if (!phoneRegex.test(phoneNumber)) {
    errors.phoneError = 'Invalid phone number format.';
  }

  if (password.length > 10) {
    errors.passwordError = 'Password cannot exceed 10 characters.';
  }

  // Check if username, email, or phone number exists
  const existingUser = await User.findOne({ $or: [{ username }, { email }, { phoneNumber }] });
  if (existingUser) {
    if (existingUser.username === username) {
      errors.usernameError = 'Username already exists.';
    }
    if (existingUser.email === email) {
      errors.emailError = 'Email already exists.';
    }
    if (existingUser.phoneNumber === phoneNumber) {
      errors.phoneError = 'Phone number already exists.';
    }
  }

  // If there are errors, return them
  if (Object.keys(errors).length > 0) {
    return res.json({ success: false, ...errors });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save the user
    const newUser = new User({
      username,
      fullname,
      password: hashedPassword,
      email,
      phoneNumber,
    });
    await newUser.save();

    res.json({ success: true, message: 'User registered successfully. Redirecting to login page...' });
  } catch (err) {
    res.json({ success: false, message: 'Error registering user.', error: err });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.json({ message: 'Something went wrong, please try again.' });
    }
    // Redirect to login page after successful logout
    res.redirect('/login.html');
  });
});

// Route to check session
app.get('/check-session', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true });
  } else {
    res.json({ loggedIn: false });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  let errors = {
    usernameOrEmailError: '',
    passwordError: '',
  };

  try {
    // Find the user by email or username
    const user = await User.findOne({
      $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
    });

    if (!user) {
      errors.usernameOrEmailError = 'Invalid username/email. Please try again.';
      errors.passwordError = 'Invalid password. Please try again.';
    } else {
      // Check password only if user exists
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        errors.usernameOrEmailError = 'Invalid username/email. Please try again.';
        errors.passwordError = 'Invalid password. Please try again.';
      } else {
        // Store user info in session after successful login
        req.session.user = {
          username: user.username,
          email: user.email
        };
      }
    }

    // Return errors if any exist
    if (errors.usernameOrEmailError || errors.passwordError) {
      return res.json({ success: false, ...errors });
    }

    // If no errors, return success with the username
    res.json({ 
      success: true, 
      message: `Welcome @${user.username}. Redirecting to home page...`, 
      username: user.username 
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'An error occurred during login.' });
  }
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
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve the index.html file on the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Force HTTPS in production (when deployed)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect('https://' + req.headers.host + req.url);
    }
    return next();
  });
}


// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
