const express = require('express');
const path = require('path');
const fs = require('fs').promises; // Use async/await
const app = express();
const port = process.env.PORT || 3000;

// ================== FIX 1: Simplified Static Handling ==================
// Serve ALL static files from root folder (no separate routes)
app.use(express.static(path.join(__dirname)));

// ================== FIX 2: Universal Route Handler ==================
app.get('/:type/:category', async (req, res) => {
  const { type, category } = req.params;
  const validTypes = ['jest', 'nsfw', 'fun'];
  
  // Validate type
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: "Invalid type! Use jest/nsfw/fun" });
  }

  // Special handling for 'fun' text-based categories
  if (type === 'fun') {
    try {
      const data = require(`./fun/${category}`);
      const randomItem = data[Math.floor(Math.random() * data.length)];
      return res.json({ success: true, content: randomItem });
    } catch (err) {
      return res.status(404).json({ error: `Category '${category}' not found in fun!` });
    }
  }

  // Handle image categories (jest/nsfw)
  try {
    const folderPath = path.join(__dirname, type, category);
    const files = await fs.readdir(folderPath);
    const images = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));

    if (images.length === 0) {
      return res.status(404).json({ error: `No images found for ${type}/${category}` });
    }

    const randomImage = images[Math.floor(Math.random() * images.length)];
    res.json({
      success: true,
      imageUrl: `/${type}/${category}/${randomImage}`
    });
  } catch (err) {
    res.status(500).json({
      error: `Error accessing ${type}/${category}. Verify: 1) Folder exists 2) Images uploaded`
    });
  }
});

// ================== FIX 3: Root Route ==================
app.get('/', (req, res) => {
  res.send(`
    <h1>Welcome to MX-GAMECODER API!<h1>
    <p>Try these endpoints:</p>
    <ul>
      <li>/jest/slap</li>
      <li>/nsfw/waifu</li>
      <li>/fun/joke</li>
    </ul>
  `);
});

// Start server
app.listen(port, () => console.log(`Server dey run for port ${port}!`));
