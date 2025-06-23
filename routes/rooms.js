import express from "express";
import { body, validationResult } from "express-validator";
import { buildUpdateQuery } from "../utils/sqlUpdateBuilder.js";
import { pool } from "../db.js";

const router = express.Router();

const allowedFields = [
  "number",
  "type",
  "capacity",
  "price_per_night",
  "description",
];

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM rooms ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/available", async (req, res) => {
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    return res
      .status(400)
      .json({ error: "start_date and end_date query params are required" });
  }

  try {
    const result = await pool.query(
      `
                SELECT *
                FROM rooms r
                WHERE NOT EXISTS (SELECT 1
                                  FROM bookings b
                                  WHERE b.room_id = r.id
                                    AND b.status IN ('PENDING', 'CONFIRMED')
                                    AND NOT (b.end_date < $1 OR b.start_date > $2))
            `,
      [start_date, end_date],
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM rooms WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Room not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post(
  "/",
  [
    body("number").isString().trim().notEmpty(),
    body("type").optional().isString().trim(),
    body("capacity").optional().isInt({ min: 1 }),
    body("price_per_night").optional().isDecimal(),
    body("description").optional().isString().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { number, type, capacity, price_per_night, description } = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO rooms (number, type, capacity, price_per_night, description)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
        [
          number,
          type || null,
          capacity || null,
          price_per_night || null,
          description || null,
        ],
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

router.put(
  "/:id",
  [
    body("number").optional().isString().trim().notEmpty(),
    body("type").optional().isString().trim(),
    body("capacity").optional().isInt({ min: 1 }),
    body("price_per_night").optional().isDecimal(),
    body("description").optional().isString().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { updates, values } = buildUpdateQuery(allowedFields, req.body);
    if (updates.length === 0)
      return res.status(400).json({ error: "No fields to update" });

    values.push(req.params.id);

    const query = `
            UPDATE rooms
            SET ${updates.join(", ")}
            WHERE id = $${values.length}
      RETURNING *;
    `;

    try {
      const result = await pool.query(query, values);
      if (result.rows.length === 0)
        return res.status(404).json({ error: "Room not found" });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM rooms WHERE id = $1", [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
