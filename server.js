const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const port = 3000;

// Serve static files from the nsfw, jest, and fun folders
app.use('/nsfw', express.static(path.join(__dirname, 'mx', 'nsfw')));
app.use('/jest', express.static(path.join(__dirname, 'mx', 'jest')));
app.use('/fun', express.static(path.join(__dirname, 'mx', 'fun')));

// Route to serve random image from the NSFW folder (e.g., ass)
app.get('/nsfw/ass/random-image', (req, res) => {
  const images = fs.readdirSync(path.join(__dirname, 'mx', 'nsfw', 'ass'));  // Ass folder inside nsfw
  const randomImage = images[Math.floor(Math.random() * images.length)];
  res.send(`/nsfw/ass/${randomImage}`);
});

// You can add more routes for other NSFW subfolders as needed, like anime, blowjob, etc.

// Route to serve random image from the Jest folder (e.g., kiss)
app.get('/jest/kiss/random-image', (req, res) => {
  const images = fs.readdirSync(path.join(__dirname, 'mx', 'jest', 'kiss'));  // Kiss folder inside jest
  const randomImage = images[Math.floor(Math.random() * images.length)];
  res.send(`/jest/kiss/${randomImage}`);
});

// Similarly, for other folders inside Jest (e.g., slap, etc.)
app.get('/jest/slap/random-image', (req, res) => {
  const images = fs.readdirSync(path.join(__dirname, 'mx', 'jest', 'slap'));  // Slap folder inside jest
  const randomImage = images[Math.floor(Math.random() * images.length)];
  res.send(`/jest/slap/${randomImage}`);
});

// Route to serve random image from the Fun folder (you can specify subfolders inside Fun)
app.get('/fun/code/random-image', (req, res) => {
  const images = fs.readdirSync(path.join(__dirname, 'mx', 'fun', 'code'));  // Code folder inside fun
  const randomImage = images[Math.floor(Math.random() * images.length)];
  res.send(`/fun/code/${randomImage}`);
});

// You can add more routes for other folders inside Fun like truth, dare, etc.

// Import the categories
const jokes = require('./fun/joke');
const facts = require('./fun/fact');
const quotes = require('./fun/quote');
const truths = require('./fun/truth');
const dares = require('./fun/dare');
const riddles = require('./fun/riddle');
const compliments = require('./fun/compliment');

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
// Serve the HTML page (index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});