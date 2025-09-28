// routes/marketplace.js
const express = require('express');
const router = express.Router();
const MarketplaceAPI = require('../models/MarketplaceAPI');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const freeApis = require('../data/freeApis'); // ✅ Include free APIs
const VaultX = require("vaultx-sdk");
const authenticate = require("../middleware/auth");
const AdmZip = require("adm-zip");
const dotenv = require('dotenv');
dotenv.config();
const vaultx = new VaultX({
  publicUserId: process.env.VAULTX_PUBLIC_USERID, // e.g. mxapi_xsot4s1w
  folder: process.env.VAULTX_FOLDERe,              // e.g. marketplace
});

// React to an API (like, dislike, comment)
router.post('/react', async (req, res) => {
  const { apiId, type, userId, username, commentText, commentId, edit } = req.body;

  try {
    const api = await MarketplaceAPI.findById(apiId);
    if (!api) return res.status(404).json({ success: false, message: "API not found" });

    let updated = false;

    // ✅ Toggle like
    if (type === 'like') {
      if (api.likes.includes(userId)) {
        api.likes = api.likes.filter(u => u !== userId); // unlike
      } else {
        api.likes.push(userId);
        api.dislikes = api.dislikes.filter(u => u !== userId); // remove from dislikes if exists
      }
      updated = true;
    }

    // ✅ Toggle dislike
    if (type === 'dislike') {
      if (api.dislikes.includes(userId)) {
        api.dislikes = api.dislikes.filter(u => u !== userId); // undislike
      } else {
        api.dislikes.push(userId);
        api.likes = api.likes.filter(u => u !== userId); // remove from likes if exists
      }
      updated = true;
    }

    // Add/Edit comment
    if (type === 'comment') {
      const wordCount = commentText.trim().split(/\s+/).length;
      if (wordCount < 1 || wordCount > 300) {
        return res.status(400).json({ success: false, message: "Comment must be between 1 and 300 words" });
      }

      if (edit && commentId) {
        const comment = api.comments.id(commentId);
        if (comment && comment.userId === userId) {
          comment.text = commentText;
          comment.edited = true;
        }
      } else {
        api.comments.push({ userId, username, text: commentText });

        // ✅ Assign first commenter badge if none yet
        if (!api.firstCommenter) {
          api.firstCommenter = { userId, username };
        }
      }
      updated = true;
    }

    if (updated) {
      api.lastUpdated = new Date();
      await api.save();
    }

    res.json({ success: true, message: "API updated", api });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get('/comments/:apiId', async (req, res) => {
  try {
    const api = await MarketplaceAPI.findById(req.params.apiId);
    if (!api) return res.status(404).json({ success: false, message: "API not found" });

    res.json({
      success: true,
      firstCommenter: api.firstCommenter || null, // <--- ADD THIS
      comments: (api.comments || []).sort((a, b) => b.createdAt - a.createdAt)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// DELETE: Delete a reply
router.delete('/comment/reply/:apiId/:commentId/:replyId', async (req, res) => {
  const { apiId, commentId, replyId } = req.params;
  const { userId } = req.query;

  try {
    const api = await MarketplaceAPI.findById(apiId);
    if (!api) return res.status(404).json({ success: false, message: "API not found" });

    const comment = api.comments.id(commentId);
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

    const reply = comment.replies.id(replyId);
    if (!reply) return res.status(404).json({ success: false, message: "Reply not found" });

    if (reply.userId !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    reply.deleteOne();
    api.lastUpdated = new Date();
    await api.save();

    res.json({ success: true, message: "Reply deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// PATCH: Update API lastUpdated
router.patch('/update/:apiId', async (req, res) => {
  const { apiId } = req.params;

  try {
    const api = await MarketplaceAPI.findById(apiId);
    if (!api) return res.status(404).json({ success: false, message: "API not found" });

    api.lastUpdated = new Date();
    await api.save();

    res.json({ success: true, message: "Last updated timestamp refreshed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get user's owned APIs including free ones
router.get('/user/owned-apis/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findOne({ publicUserId: userId }); // ✅ fixed

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const userOwned = user.ownedApis || [];

    // Add free APIs
    const freeOwned = freeApis.map(fp => {
      const [category, name] = fp.split('/');
      return {
        name,
        category,
        filePath: fp
      };
    });

    const combined = [...userOwned, ...freeOwned];

    res.json({ success: true, owned: combined });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST: Reply to a comment
router.post('/reply', async (req, res) => {
  const { apiId, commentId, userId, username, text } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ success: false, message: "Reply cannot be empty" });
  }

  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount < 1 || wordCount > 300) {
    return res.status(400).json({ success: false, message: "Reply must be between 1 and 300 words" });
  }

  try {
    const api = await MarketplaceAPI.findById(apiId);
    if (!api) return res.status(404).json({ success: false, message: "API not found" });

    const comment = api.comments.id(commentId);
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

    comment.replies.push({ userId, username, text });
    api.lastUpdated = new Date();
    await api.save();

    res.json({ success: true, message: "Reply added successfully!", replies: comment.replies });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// PATCH: Edit a reply
router.patch('/comment/reply/:apiId/:commentId/:replyId', async (req, res) => {
  const { apiId, commentId, replyId } = req.params;
  const { userId, text } = req.body;

  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount < 1 || wordCount > 300) {
    return res.status(400).json({ success: false, message: "Reply must be between 1 and 300 words" });
  }

  try {
    const api = await MarketplaceAPI.findById(apiId);
    if (!api) return res.status(404).json({ success: false, message: "API not found" });

    const comment = api.comments.id(commentId);
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

    const reply = comment.replies.id(replyId);
    if (!reply) return res.status(404).json({ success: false, message: "Reply not found" });

    if (reply.userId !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    reply.text = text;
    reply.edited = true;
    api.lastUpdated = new Date();
    await api.save();

    res.json({ success: true, message: "Reply edited successfully", reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// DELETE main comment
router.delete('/comment/:apiId/:commentId', async (req, res) => {
  const { apiId, commentId } = req.params;
  const { userId } = req.query;

  try {
    const api = await MarketplaceAPI.findById(apiId);
    if (!api) return res.status(404).json({ success: false, message: "API not found" });

    const comment = api.comments.id(commentId);
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

    if (comment.userId !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    comment.deleteOne();
    api.lastUpdated = new Date();
    await api.save();

    res.json({ success: true, message: "Comment deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST: Upload a new API to marketplace
router.post('/upload', authenticate, async (req, res) => {
  try {
    let { name, category, description, price, duration, available } = req.body;

    price = Number(price);
    if (duration !== "unlimited") duration = Number(duration);
    if (available !== "unlimited") available = Number(available);

    // --- VALIDATION ---
    if (!name || name.length > 15) {
      return res.status(400).json({ success: false, message: "API name must not exceed 15 characters" });
    }
    if (!/^[a-zA-Z0-9]{3,15}$/.test(name)) {
      return res.status(400).json({ success: false, message: "API name must be 3–15 letters/numbers only" });
    }
    if (!category || !/^[A-Za-z\s]{2,15}$/.test(category)) {
      return res.status(400).json({ success: false, message: "Category must be 2–15 letters only" });
    }

    // ✅ Category uniqueness check
    const existing = await MarketplaceAPI.findOne({ name: name, category: category });
    if (existing) {
      return res.status(400).json({ success: false, message: "An API with this name already exists in this category" });
    }

    if (!description || description.trim().length < 10) {
      return res.status(400).json({ success: false, message: "Description must be at least 10 characters" });
    }
    if (typeof price !== "number" || price < 0 || price > 6000) {
      return res.status(400).json({ success: false, message: "Price must be between 0 and 6000" });
    }
    if (!(duration === "unlimited" || (typeof duration === "number" && duration > 0))) {
      return res.status(400).json({ success: false, message: "Duration must be a positive number or 'unlimited'" });
    }
    if (!(available === "unlimited" || (typeof available === "number" && available > 0))) {
      return res.status(400).json({ success: false, message: "Available must be a positive number or 'unlimited'" });
    }

    // ✅ Must have code ZIP
    if (!req.files || !req.files.codeZip) {
      return res.status(400).json({ success: false, message: "Code ZIP file is required" });
    }
    const zipFile = req.files.codeZip;
    if (!zipFile.name.endsWith(".zip")) {
      return res.status(400).json({ success: false, message: "Only .zip files allowed" });
    }

    // ✅ Owner info
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // ✅ Image handling
    let imageUrlFinal = null;
    if (req.files.image) {
      const img = req.files.image;
      try {
        const imgRes = await vaultx.upload("marketplace-images", img.data, {
          filename: img.name,
          contentType: img.mimetype
        });
        imageUrlFinal = imgRes.file.fileUrl;
      } catch (err) {
        console.error("VaultX image upload failed", err.message);
        return res.status(500).json({ success: false, message: "Image upload failed" });
      }
    } else if (req.body.imageUrl) {
      imageUrlFinal = req.body.imageUrl;
    } else {
      return res.status(400).json({ success: false, message: "Image (upload or URL) is required" });
    }

    // ✅ Save in DB
    const newApi = new MarketplaceAPI({
      name,
      category,
      description,
      createdBy: req.user.id,
      ownerUsername: user.username,   // 👈 Add owner’s username
      price,
      duration,
      available,
      files: [],
      folderName: null,
      image: imageUrlFinal,
      status: "pending"
    });
    await newApi.save();

    res.json({ 
      success: true, 
      message: "API uploaded, processing code...", 
      api: newApi 
    });

    // 🔄 Background: extract ZIP (same as before)
    setImmediate(async () => {
      try {
        const zip = new AdmZip(zipFile.data);
        const entries = zip.getEntries();
        if (entries.length === 0) return console.log("ZIP empty, nothing to extract");

        const folderName = `mxapi_server/${newApi._id}`;
        const absFolderPath = path.join(__dirname, `../${folderName}`);
        fs.mkdirSync(absFolderPath, { recursive: true });

        const savedFiles = [];
        for (const entry of entries) {
          if (entry.isDirectory) continue;
          const relativePath = entry.entryName;
          const fileBuffer = entry.getData();

          const targetPath = path.join(absFolderPath, relativePath);
          fs.mkdirSync(path.dirname(targetPath), { recursive: true });
          fs.writeFileSync(targetPath, fileBuffer);

          savedFiles.push({ path: relativePath, localPath: `${folderName}/${relativePath}` });
        }

        await MarketplaceAPI.findByIdAndUpdate(newApi._id, {
          $set: {
            files: savedFiles,
            folderName: folderName,
            status: "reviewed"
          }
        });

        console.log("✅ API code extracted and marked as reviewed:", folderName);
      } catch (err) {
        console.error("Background extract failed:", err);
      }
    });

  } catch (err) {
    console.error("[UPLOAD ERROR]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// fetch api from db
router.get("/all", async (req, res) => {
  try {
    const apis = await MarketplaceAPI.find({});
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - sevenDays;
    const fourteenDaysAgo = now - 2 * sevenDays;

    // ✅ Ranking logic
    const ranked = [...apis].sort((a, b) => {
      const scoreA = (a.buyCount || 0) + (a.likes?.length || 0) + (a.comments?.length || 0);
      const scoreB = (b.buyCount || 0) + (b.likes?.length || 0) + (b.comments?.length || 0);
      return scoreB - scoreA;
    });

    ranked.forEach((api, idx) => {
      api.rank = idx + 1;
    });
    await Promise.all(ranked.map(a => a.save()));

    // ✅ Response formatting
    res.json({
      success: true,
      apis: apis.map(api => {
        const isNew = now - new Date(api.createdAt).getTime() < sevenDays;

        // 🆕 Hot check (buys in last 7 days)
        const recentBuys = api.ownedApis?.filter(o =>
          new Date(o.purchasedAt).getTime() >= sevenDaysAgo
        ).length || 0;

        // ==========================
        // ⭐ Popular: two–week logic
        // ==========================

        // Week 1 (7–14 days ago)
        const week1Likes = (api.likes || []).filter(
          l => {
            const t = new Date(l.createdAt || api.lastUpdated).getTime();
            return t >= fourteenDaysAgo && t < sevenDaysAgo;
          }
        ).length;

        const week1Comments = new Set(
          (api.comments || [])
            .filter(c => {
              const t = new Date(c.createdAt).getTime();
              return t >= fourteenDaysAgo && t < sevenDaysAgo;
            })
            .map(c => c.userId?.toString())
        ).size;

        // Week 2 (last 7 days)
        const week2Likes = (api.likes || []).filter(
          l => new Date(l.createdAt || api.lastUpdated).getTime() >= sevenDaysAgo
        ).length;

        const week2Comments = new Set(
          (api.comments || [])
            .filter(c => new Date(c.createdAt).getTime() >= sevenDaysAgo)
            .map(c => c.userId?.toString())
        ).size;

        // ✅ Final Popular decision
        let isPopular = false;
        if ((week1Likes + week1Comments) >= 15) {
          isPopular = true; // First week
        } else if ((week2Likes + week2Comments) >= 20) {
          isPopular = true; // Needs more activity in 2nd week
        }

        return {
          id: api._id.toString(),
          name: api.name,
          category: api.category,
          description: api.description,
          owner: api.ownerUsername,
          price: api.price,
          duration: api.duration,
          available: api.available,
          status: api.status,
          image: api.image,
          createdAt: api.createdAt,
          likes: api.likes,
          dislikes: api.dislikes,
          comments: api.comments,
          lastUpdated: api.lastUpdated,

          // Tags
          isNew,
          isHot: recentBuys >= 20,
          isPopular,
          rank: api.rank
        };
      })
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch APIs" });
  }
});

// POST: Buy an API
router.post('/buy', async (req, res) => {
  const { userId, apiId } = req.body;

  const user = await User.findOne({ publicUserId: userId });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  let api;
  let isStatic = false;

  if (apiId.startsWith('json_api_')) {
    // static json handling
  } else {
    api = await MarketplaceAPI.findById(apiId);
    if (!api) return res.status(404).json({ success: false, message: 'API not found' });
  }

  if (user.coins < api.price) {
    return res.status(400).json({ success: false, message: 'Not enough coins 💰' });
  }

  const alreadyOwned = user.ownedApis.some(entry => entry.filePath === `${api.category}/${api.name}`);
  if (alreadyOwned) {
    return res.status(400).json({ success: false, message: 'You already own this API' });
  }

  user.coins -= api.price;

  user.ownedApis.push({
    name: api.name,
    category: api.category,
    filePath: `${api.category}/${api.name}`,
    purchasedAt: new Date()
  });

  if (!isStatic) {
    api.available = api.available === "unlimited" ? "unlimited" : api.available - 1;
    api.buyCount += 1;  // 👈 track buy count
    await api.save();
  }

  await user.save();

  res.json({ success: true, message: 'API purchased successfully 🎉' });
});

module.exports = router;
