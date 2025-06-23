import express from "express";
import { body, validationResult } from "express-validator";
import { buildUpdateQuery } from "../utils/sqlUpdateBuilder.js";
import { pool } from "../db.js";

const router = express.Router();

const allowedFields = ["full_name", "email", "phone", "is_vip"];

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM clients ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM clients WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Client not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post(
  "/",
  [
    body("full_name").isString().trim().notEmpty(),
    body("email").isEmail().normalizeEmail(),
    body("phone").optional().isString().trim(),
    body("is_vip").optional().isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { full_name, email, phone, is_vip } = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO clients (full_name, email, phone, is_vip)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
        [full_name, email, phone || null, is_vip || false],
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
    body("full_name").optional().isString().trim().notEmpty(),
    body("email").optional().isEmail().normalizeEmail(),
    body("phone").optional().isString().trim(),
    body("is_vip").optional().isBoolean(),
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
            UPDATE clients
            SET ${updates.join(", ")}
            WHERE id = $${values.length}
      RETURNING *;
    `;

    try {
      const result = await pool.query(query, values);
      if (result.rows.length === 0)
        return res.status(404).json({ error: "Client not found" });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM clients WHERE id = $1", [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
