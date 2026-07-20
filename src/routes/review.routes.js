const express = require("express");
const pool = require("../config/database");

const router = express.Router();
/**
 * @swagger
 * /api/reviews/{movieId}:
 *   post:
 *     summary: Add a review
 *     tags:
 *       - Reviews
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
 *               review:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review added successfully
 */
// Add review
router.post("/:movieId", async (req, res) => {
  try {
    const { review } = req.body;

    const result = await pool.query(
      `INSERT INTO reviews (movie_id, user_id, review)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.params.movieId, req.user.id, review]
    );

    res.status(201).json({
      success: true,
      review: result.rows[0]
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
 * /api/reviews/{movieId}:
 *   get:
 *     summary: Get movie reviews
 *     tags:
 *       - Reviews
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of reviews
 */
// Get reviews for a movie
router.get("/:movieId", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT reviews.*, users.name
       FROM reviews
       JOIN users ON reviews.user_id = users.id
       WHERE movie_id = $1
       ORDER BY created_at DESC`,
      [req.params.movieId]
    );

    res.json({
      success: true,
      reviews: result.rows
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
