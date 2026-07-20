const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

router.get("/stats", auth, admin, async (req, res) => {
  try {
    const users = await pool.query("SELECT COUNT(*) FROM users");
    const movies = await pool.query("SELECT COUNT(*) FROM movies");
    const reviews = await pool.query("SELECT COUNT(*) FROM reviews");
    const ratings = await pool.query("SELECT COUNT(*) FROM ratings");
    const favorites = await pool.query("SELECT COUNT(*) FROM favorites");

    res.json({
      success: true,
      stats: {
        totalUsers: Number(users.rows[0].count),
        totalMovies: Number(movies.rows[0].count),
        totalReviews: Number(reviews.rows[0].count),
        totalRatings: Number(ratings.rows[0].count),
        totalFavorites: Number(favorites.rows[0].count)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;
