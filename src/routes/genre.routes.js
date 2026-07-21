const express = require("express");
const pool = require("../config/database");
const auth = require("../middleware/auth");

const router = express.Router();
/**
 * @swagger
 * /api/genres:
 *   get:
 *     summary: Get all genres
 *     tags:
 *       - Genres
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of genres
 */
// Get all genres
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM genres ORDER BY name ASC"
    );

    res.json({
      success: true,
      genres: result.rows
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
 * /api/genres:
 *   post:
 *     summary: Create a new genre
 *     tags:
 *       - Genres
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Genre created successfully
 */
// Create genre
router.post("/", auth, async (req, res) => {
  try {
    const { name } = req.body;

    const result = await pool.query(
      `INSERT INTO genres(name)
       VALUES($1)
       RETURNING *`,
      [name]
    );

    res.status(201).json({
      success: true,
      genre: result.rows[0]
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
 * /api/genres/{id}:
 *   put:
 *     summary: Update a genre
 *     tags:
 *       - Genres
 *     security:
 *       - bearerAuth: []
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
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Genre updated
 */
// Update genre
router.put("/:id", auth, async (req, res) => {
  try {
    const { name } = req.body;

    const result = await pool.query(
      `UPDATE genres
       SET name=$1
       WHERE id=$2
       RETURNING *`,
      [name, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Genre not found"
      });
    }

    res.json({
      success: true,
      genre: result.rows[0]
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
 * /api/genres/{id}:
 *   delete:
 *     summary: Delete a genre
 *     tags:
 *       - Genres
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Genre deleted
 */
// Delete genre
router.delete("/:id", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM genres WHERE id=$1 RETURNING *",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Genre not found"
      });
    }

    res.json({
      success: true,
      message: "Genre deleted successfully"
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
