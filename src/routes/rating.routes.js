const express = require("express");
const pool = require("../config/database");
const auth = require("../middleware/auth");
const router = express.Router();
/**
 * @swagger
 * /api/ratings/{movieId}:
 *   post:
 *     summary: Rate a movie
 *     tags:
 *       - Ratings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       200:
 *         description: Rating saved successfully
 */
// Add or update rating
router.post("/:movieId", auth, async (req, res) => {
  try {
    const { rating } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    const result = await pool.query(
      `INSERT INTO ratings (movie_id, user_id, rating)
       VALUES ($1, $2, $3)
       ON CONFLICT (movie_id, user_id)
       DO UPDATE SET rating = EXCLUDED.rating
       RETURNING *`,
      [req.params.movieId, req.user.id, rating]
    );

    res.json({
      success: true,
      rating: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});
/**
 * @swagger
 * /api/ratings/{movieId}:
 *   get:
 *     summary: Get movie rating
 *     tags:
 *       - Ratings
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Movie rating statistics
 */
// Get average rating
router.get("/:movieId", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         ROUND(AVG(rating), 2) AS average_rating,
         COUNT(*) AS total_ratings
       FROM ratings
       WHERE movie_id = $1`,
      [req.params.movieId]
    );

    res.json({
      success: true,
      stats: result.rows[0]
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
