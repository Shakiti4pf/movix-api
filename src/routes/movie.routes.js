const express = require("express");
const pool = require("../config/database");
const { body, validationResult } = require("express-validator");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const upload = require("../middleware/upload");

const router = express.Router();
console.log("✅ movie.routes.js loaded");
/*
|--------------------------------------------------------------------------
| CREATE MOVIE
|--------------------------------------------------------------------------
*/
router.post(
    "/",
    auth,
    admin,

  [
    body("title")
      .trim()
      .notEmpty()
      .withMessage("Title is required"),

    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),

    body("year")
      .isInt({ min: 1888, max: 2100 })
      .withMessage("Enter a valid year"),

    body("genre_id")
      .isInt()
      .withMessage("Genre ID must be a number")
  ],

  upload.single("poster"),

  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    try {
      const { title, description, year, genre_id } = req.body;

      const poster_url = req.file
        ? `/uploads/${req.file.filename}`
        : null;

      const result = await pool.query(
        `INSERT INTO movies
        (title, description, year, genre_id, created_by, poster_url)
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING *`,
        [
          title,
          description,
          year,
          genre_id,
          req.user.id,
          poster_url,
         ]
      );

      res.status(201).json({
        success: true,
        movie: result.rows[0],
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| GET ALL MOVIES
|--------------------------------------------------------------------------
*/
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
SELECT
    id,
    title,
    created_by
FROM movies
ORDER BY id;

    `);

    res.json({
      success: true,
      movies: result.rows,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});
/*
|--------------------------------------------------------------------------
| SEARCH MOVIES
|--------------------------------------------------------------------------
*/
router.get("/search", async (req, res) => {
  try {
    const search = req.query.q || "";

    const result = await pool.query(
      `
      SELECT
        movies.*,
        genres.name AS genre
      FROM movies
      LEFT JOIN genres
      ON movies.genre_id = genres.id
      WHERE LOWER(movies.title) LIKE LOWER($1)
      ORDER BY movies.title ASC
      `,
      [`%${search}%`]
    );

    res.json({
      success: true,
      movies: result.rows,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/*
|--------------------------------------------------------------------------
| FILTER MOVIES
|--------------------------------------------------------------------------
*/
router.get("/filter", auth, async (req, res) => {
  try {
    const { genre, year, director } = req.query;

    let sql = `
      SELECT
        m.*,
        g.name AS genre,
        d.name AS director
      FROM movies m
      LEFT JOIN genres g
        ON m.genre_id = g.id
      LEFT JOIN directors d
        ON m.director_id = d.id
      WHERE 1=1
    `;

    const values = [];

    if (genre) {
      values.push(genre);
      sql += ` AND g.name = $${values.length}`;
    }

    if (year) {
      values.push(year);
      sql += ` AND m.year = $${values.length}`;
    }

    if (director) {
      values.push(director);
      sql += ` AND d.name = $${values.length}`;
    }

    sql += " ORDER BY m.title ASC";

    const result = await pool.query(sql, values);

    res.json({
      success: true,
      count: result.rows.length,
      movies: result.rows,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});
/*
|--------------------------------------------------------------------------
| GET MOVIE BY ID
|--------------------------------------------------------------------------
*/
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        movies.*,
        genres.name AS genre
      FROM movies
      LEFT JOIN genres
      ON movies.genre_id = genres.id
      WHERE movies.id = $1
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    res.json({
      success: true,
      movie: result.rows[0],
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/*
|--------------------------------------------------------------------------
| UPDATE MOVIE
|--------------------------------------------------------------------------
*/
router.put("/:id", auth, admin, async (req, res) => {
  try {
    const { title, description, year, genre_id } = req.body;

    const result = await pool.query(
      `
      UPDATE movies
      SET
        title = $1,
        description = $2,
        year = $3,
        genre_id = $4
      WHERE id = $5
      RETURNING *
      `,
      [
        title,
        description,
        year,
        genre_id,
        req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    res.json({
      success: true,
      movie: result.rows[0],
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/*
|--------------------------------------------------------------------------
| DELETE MOVIE
|--------------------------------------------------------------------------
*/
router.delete("/:id", auth, admin, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM movies WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    res.json({
      success: true,
      message: "Movie deleted successfully",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});
/*
|--------------------------------------------------------------------------
| MOVIE DETAILS
|--------------------------------------------------------------------------
*/
router.get("/:id/details", auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Movie
    const movieResult = await pool.query(
      `
      SELECT
        m.*,
        g.name AS genre,
        d.name AS director
      FROM movies m
      LEFT JOIN genres g ON m.genre_id = g.id
      LEFT JOIN directors d ON m.director_id = d.id
      WHERE m.id = $1
      `,
      [id]
    );

    if (movieResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    // Actors
    const actorsResult = await pool.query(
      `
      SELECT
        a.id,
        a.name
      FROM movie_actors ma
      JOIN actors a ON ma.actor_id = a.id
      WHERE ma.movie_id = $1
      `,
      [id]
    );

    // Reviews
    const reviewsResult = await pool.query(
      `
      SELECT
        r.review,
        u.name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.movie_id = $1
      `,
      [id]
    );

    // Average Rating
    const ratingResult = await pool.query(
      `
      SELECT
        COALESCE(AVG(rating),0)::numeric(10,2) AS average_rating
      FROM ratings
      WHERE movie_id = $1
      `,
      [id]
    );

    res.json({
      success: true,
      movie: movieResult.rows[0],
      actors: actorsResult.rows,
      reviews: reviewsResult.rows,
      average_rating: ratingResult.rows[0].average_rating,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
