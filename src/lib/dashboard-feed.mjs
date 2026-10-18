export const activityTables = [
  "chat_notes",
  "calendar_events",
  "photo_diary",
  "mood_logs",
  "shared_goals",
  "playlist_tracks",
  "mystery_boxes",
];

// IDs are unique within a table; the combined feed needs a table-qualified key.
export function buildActivityFeed(groups) {
  return groups
    .flatMap(({ table, rows }) =>
      rows.map((row) => ({
        ...row,
        kind: table,
        activityId: `${table}:${row.id}`,
      })),
    )
    .sort(
      (a, b) =>
        new Date(b.created_at) - new Date(a.created_at) ||
        a.activityId.localeCompare(b.activityId),
    );
}

export function filterActivity(items, kind, query) {
  const term = query.trim().toLowerCase();
  return items.filter(
    (item) =>
      (kind === "all" || item.kind === kind) &&
      [item.title, item.body, item.notes, item.mood]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
  );
}
