const express = require("express");
const pool = require("../config/database");

const router = express.Router();
/**
 * @swagger
 * /api/favorites/{movieId}:
 *   post:
 *     summary: Add movie to favorites
 *     tags:
 *       - Favorites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Movie added to favorites
 */
// Add movie to favorites
router.post("/:movieId", async (req, res) => {
  try {
    const result = await pool.query(
      `INSERT INTO favorites (user_id, movie_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, movie_id) DO NOTHING
       RETURNING *`,
      [req.user.id, req.params.movieId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        message: "Movie is already in favorites"
      });
    }

    res.status(201).json({
      success: true,
      favorite: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Get user favorites
 *     tags:
 *       - Favorites
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorite movies
 */

// Get user's favorites
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         favorites.id,
         movies.id AS movie_id,
         movies.title,
         movies.description,
         movies.year
       FROM favorites
       JOIN movies
         ON favorites.movie_id = movies.id
       WHERE favorites.user_id = $1
       ORDER BY favorites.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      favorites: result.rows
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
 * /api/favorites/{movieId}:
 *   delete:
 *     summary: Remove movie from favorites
 *     tags:
 *       - Favorites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Favorite removed successfully
 */
// Remove favorite
router.delete("/:movieId", async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM favorites
       WHERE user_id = $1
       AND movie_id = $2`,
      [req.user.id, req.params.movieId]
    );

    res.json({
      success: true,
      message: "Favorite removed"
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
