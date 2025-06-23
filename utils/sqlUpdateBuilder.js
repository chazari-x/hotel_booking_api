export const buildUpdateQuery = (allowedFields, body, startIndex = 1) => {
  const updates = [];
  const values = [];
  let idx = startIndex;

  for (const key of allowedFields) {
    if (body.hasOwnProperty(key)) {
      const value = body[key];
      if (value === null) {
        updates.push(`${key} = NULL`);
      } else {
        updates.push(`${key} = $${idx++}`);
        values.push(typeof value === "string" ? value.trim() : value);
      }
    }
  }

  return { updates, values };
};
