const express = require("express");
const pool = require("../config/database");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Watchlist
 *   description: User watchlist
 */

/**
 * @swagger
 * /api/watchlist/{movieId}:
 *   post:
 *     summary: Add movie to watchlist
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 */
router.post("/:movieId", auth, async (req, res) => {
    try {
        const result = await pool.query(
            `INSERT INTO watchlist(user_id, movie_id)
             VALUES($1,$2)
             ON CONFLICT (user_id,movie_id) DO NOTHING
             RETURNING *`,
            [req.user.id, req.params.movieId]
        );

        if (result.rows.length === 0) {
            return res.json({
                success: true,
                message: "Movie already in watchlist"
            });
        }

        res.status(201).json({
            success: true,
            watchlist: result.rows[0]
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
 * /api/watchlist:
 *   get:
 *     summary: Get user watchlist
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 */
router.get("/", auth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                m.id,
                m.title,
                m.description,
                m.year,
                g.name AS genre,
                d.name AS director
             FROM watchlist w
             JOIN movies m ON w.movie_id = m.id
             LEFT JOIN genres g ON m.genre_id = g.id
             LEFT JOIN directors d ON m.director_id = d.id
             WHERE w.user_id = $1
             ORDER BY w.created_at DESC`,
            [req.user.id]
        );

        res.json({
            success: true,
            watchlist: result.rows
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
 * /api/watchlist/{movieId}:
 *   delete:
 *     summary: Remove movie from watchlist
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Movie ID
 *     responses:
 *       200:
 *         description: Movie removed from watchlist
 */
router.delete("/:movieId", auth, async (req, res) => {
    try {
        await pool.query(
            `DELETE FROM watchlist
             WHERE user_id=$1 AND movie_id=$2`,
            [req.user.id, req.params.movieId]
        );

        res.json({
            success: true,
            message: "Movie removed from watchlist"
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
