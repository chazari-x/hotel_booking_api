import express from "express";
import { body, validationResult } from "express-validator";
import { buildUpdateQuery } from "../utils/sqlUpdateBuilder.js";
import { pool } from "../db.js";
import fetch from "node-fetch";

const router = express.Router();

const CLIENTS_API_URL =
  process.env.CLIENTS_API_URL || "http://localhost:3000/clients";

const validStatuses = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "TERMINATED",
  "CANCELLED_CONFIRMED",
];

const allowedFields = [
  "room_id",
  "client_id",
  "start_date",
  "end_date",
  "status",
];

// Функция получения данных клиента из внешнего API
async function fetchClientData(client_id) {
  const url = `${CLIENTS_API_URL}/${client_id}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Client not found");
  }
  const client = await response.json();
  return {
    client_name: client.full_name,
    client_email: client.email,
    client_phone: client.phone || null,
    is_vip: client.is_vip || false,
  };
}

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
            SELECT * FROM bookings ORDER BY created_at DESC
        `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM bookings WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Booking not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post(
  "/",
  [
    body("client_id").isInt(),
    body("room_id").isInt(),
    body("start_date").isISO8601().toDate(),
    body("end_date").isISO8601().toDate(),
    body("status").optional().isIn(validStatuses),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const {
      client_id,
      room_id,
      start_date,
      end_date,
      status = "PENDING",
    } = req.body;

    if (start_date > end_date) {
      return res
        .status(400)
        .json({ error: "start_date must be before or equal to end_date" });
    }

    try {
      const clientData = await fetchClientData(client_id);

      const overlappingBookings = await pool.query(
        `SELECT 1 FROM bookings
         WHERE room_id = $1
           AND status IN ('PENDING', 'CONFIRMED')
           AND NOT (end_date < $2 OR start_date > $3)`,
        [room_id, start_date, end_date],
      );

      if (overlappingBookings.rows.length > 0) {
        return res
          .status(409)
          .json({ error: "Room is already booked for these dates" });
      }

      const result = await pool.query(
        `INSERT INTO bookings (client_id, client_name, client_email, client_phone, is_vip, room_id, start_date, end_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          client_id,
          clientData.client_name,
          clientData.client_email,
          clientData.client_phone,
          clientData.is_vip,
          room_id,
          start_date,
          end_date,
          status,
        ],
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      if (err.message === "Client not found") {
        return res.status(404).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  },
);

router.put(
  "/:id",
  [
    body("client_id").optional().isInt(),
    body("room_id").optional().isInt(),
    body("start_date").optional().isISO8601().toDate(),
    body("end_date").optional().isISO8601().toDate(),
    body("status").optional().isIn(validStatuses),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      let updates = [];
      let values = [];

      if (req.body.client_id) {
        const clientData = await fetchClientData(req.body.client_id);

        updates.push(
          "client_id = $1",
          "client_name = $2",
          "client_email = $3",
          "client_phone = $4",
          "is_vip = $5",
        );
        values.push(
          req.body.client_id,
          clientData.client_name,
          clientData.client_email,
          clientData.client_phone,
          clientData.is_vip,
        );
      }

      const otherAllowed = allowedFields.filter((f) => f !== "client_id");
      const { updates: otherUpdates, values: otherValues } = buildUpdateQuery(
        otherAllowed,
        req.body,
        values.length + 1,
      );

      updates = updates.concat(otherUpdates);
      values = values.concat(otherValues);

      if (updates.length === 0)
        return res.status(400).json({ error: "No fields to update" });

      values.push(req.params.id);

      const query = `
        UPDATE bookings
        SET ${updates.join(", ")},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $${values.length}
        RETURNING *
      `;

      const result = await pool.query(query, values);

      if (result.rows.length === 0)
        return res.status(404).json({ error: "Booking not found" });

      res.json(result.rows[0]);
    } catch (err) {
      if (err.message === "Client not found") {
        return res.status(404).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  },
);

router.delete("/:id", async (req, res) => {
  try {
    const bookingRes = await pool.query(
      "SELECT status FROM bookings WHERE id = $1",
      [req.params.id],
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const currentStatus = bookingRes.rows[0].status;
    if (
      currentStatus === "TERMINATED" ||
      currentStatus === "CANCELLED" ||
      currentStatus === "CANCELLED_CONFIRMED"
    ) {
      return res
        .status(400)
        .json({ error: "Booking already cancelled or terminated" });
    }

    let newStatus = "CANCELLED";

    if (currentStatus === "CONFIRMED") {
      newStatus = "CANCELLED_CONFIRMED";
    }

    const result = await pool.query(
      `UPDATE bookings
             SET status = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
      [newStatus, req.params.id],
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
