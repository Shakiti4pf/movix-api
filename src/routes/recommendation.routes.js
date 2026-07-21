const express = require("express");
const pool = require("../config/database");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * /api/movies/recommendations:
 *   get:
 *     summary: Get personalized movie recommendations
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 */
router.get("/", auth, async (req, res) => {
  try {
    const result = await pool.query(`

     SELECT DISTINCT
      m.id,
      m.title,
      m.description,
      m.year,
      g.name AS genre,
      d.name AS director,
      COALESCE(AVG(r.rating),0) AS average_rating
  FROM movies m
  LEFT JOIN genres g ON m.genre_id = g.id
  LEFT JOIN directors d ON m.director_id = d.id
  LEFT JOIN ratings r ON r.movie_id = m.id
  WHERE m.genre_id IN (
      SELECT DISTINCT genre_id
      FROM movies
      WHERE id IN (
          SELECT movie_id
          FROM favorites
          WHERE user_id = $1

          UNION

          SELECT movie_id
          FROM watchlist
          WHERE user_id = $1
      )
  )
  GROUP BY
      m.id,
      g.name,
      d.name
  ORDER BY
      average_rating DESC,
      m.year DESC
  LIMIT 10
  `,
      [req.user.id]
    );

    res.json({
      success: true,
      recommendations: result.rows
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
