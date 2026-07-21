const express = require("express");
const pool = require("../config/database");

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const upload = require("../middleware/upload");

const router = express.Router();
/**
 * @swagger
 * /api/movies:
 *   post:
 *     summary: Create a new movie
 *     tags:
 *       - Movies
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - year
 *               - genre_id
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               year:
 *                 type: integer
 *               genre_id:
 *                 type: integer
 *               poster:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Movie created successfully
 */
// Create movie
router.put("/:id", auth, async (req, res) => {
  try {
    const { title, description, year, genre_id } = req.body;
const poster_url = req.file
  ? `/uploads/${req.file.filename}`
  : null;
const result = await pool.query(
`INSERT INTO movies
(title, description, year, genre_id, created_by, poster_url)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *`,
[
  title,
  description,
  year,
  genre_id,
  req.user.id,
  poster_url
]
);
    res.status(201).json({
      success: true,
      movie: result.rows[0]
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
 * /api/movies:
 *   get:
 *     summary: Get all movies
 *     tags:
 *       - Movies
 *     responses:
 *       200:
 *         description: List of movies
 */
// Get all movies
router.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
const allowedSortFields = ["id", "title", "year"];
const sort = allowedSortFields.includes(req.query.sort)
    ? req.query.sort
    : "id";

const order = req.query.order === "asc" ? "ASC" : "DESC";

const result = await pool.query(
    `SELECT
        movies.*,
        genres.name AS genre
     FROM movies
     LEFT JOIN genres
     ON movies.genre_id = genres.id
     ORDER BY ${sort} ${order}
     LIMIT $1 OFFSET $2`,
    [limit, offset]
);
        res.json({
            success: true,
            page,
            limit,
            movies: result.rows
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
 * /api/movies/search:
 *   get:
 *     summary: Search movies
 *     tags:
 *       - Movies
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Matching movies
 */
router.get("/search", async (req, res) => {
  try {
    const search = req.query.q || "";

    const result = await pool.query(
      `SELECT movies.*, genres.name AS genre
       FROM movies
       LEFT JOIN genres
       ON movies.genre_id = genres.id
       WHERE LOWER(movies.title) LIKE LOWER($1)
       ORDER BY movies.title`,
      [`%${search}%`]
    );

    res.json({
      success: true,
      movies: result.rows
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
 * /api/movies/{id}:
 *   get:
 *     summary: Get one movie
 *     tags:
 *       - Movies
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Movie details
 *       404:
 *         description: Movie not found
 */
// Get one movie
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM movies WHERE id=$1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Movie not found"
      });
    }

    res.json({
      success: true,
      movie: result.rows[0]
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
 * /api/movies/{id}:
 *   put:
 *     summary: Update a movie
 *     tags:
 *       - Movies
 *     parameters:
 *       - in: path
 *         name: id
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               year:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Movie updated successfully
 *       404:
 *         description: Movie not found
 */
// Update movie
router.put("/:id", admin, async (req, res) => {
  try {
    const { title, description, year } = req.body;

    const result = await pool.query(
      `UPDATE movies
       SET title=$1, description=$2, year=$3
       WHERE id=$4
       RETURNING *`,
      [title, description, year, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Movie not found"
      });
    }

    res.json({
      success: true,
      movie: result.rows[0]
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
 * /api/movies/{id}:
 *   delete:
 *     summary: Delete a movie
 *     tags:
 *       - Movies
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Movie deleted successfully
 *       404:
 *         description: Movie not found
 */
// Delete movie
router.delete("/:id", admin, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM movies WHERE id=$1 RETURNING *",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Movie not found"
      });
    }

    res.json({
      success: true,
      message: "Movie deleted successfully"
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
