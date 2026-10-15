# 14: Note category becomes a free-text tag, not a fixed enum

## What this does

A note's `category` was a hard CHECK constraint limited to exactly five values (`ai-ml`, `backend`, `infrastructure`, `ios`, `dsa`), picked from a dropdown in the admin form. Nikan's call: category is content he writes, not a fixed system of record — he's the one who decides what tags exist and keeps the naming consistent, not the database. Changed it to a free-text field everywhere the constraint showed up.

```
backend/db/schema.sql                    — dropped the CHECK constraint
backend/controllers/notesController.js   — removed the fixed-list validation
frontend/components/NoteForm.tsx         — text input + <datalist> instead of <select>
frontend/lib/api.ts, EditNoteClient.tsx  — category: string instead of a literal union
```

## Why a `DROP CONSTRAINT`, not just a frontend change

The restriction lived in three places, and all three had to go together or the database would just reject anything the UI allowed through:

```sql
-- Was on CREATE TABLE, so a brand-new database would still get it:
category TEXT NOT NULL CHECK (category IN ('ai-ml', 'backend', 'infrastructure', 'ios', 'dsa')),
```

Removed from the `CREATE TABLE` directly (a fresh database never gets the constraint at all now), plus an `ALTER TABLE ... DROP CONSTRAINT IF EXISTS notes_category_check` for the database that already has it — same idempotent-migration pattern as every other schema change in this project (`notes/00`, `03`, `11`). Verified the constraint was actually gone with `\d notes` before trusting it.

## Autocomplete suggestions, not enforcement

A plain free-text `<input>` risks drifting into `ai-ml` / `AI-ML` / `ai_ml` as separate categories by accident. Rather than re-introducing a fixed list (which defeats the point), the form fetches the categories already in use and offers them through a native HTML `<datalist>`:

```tsx
<input id="category" list="categoryOptions" ... />
<datalist id="categoryOptions">
  {existingCategories.map((c) => <option key={c} value={c} />)}
</datalist>
```

This is pure suggestion — the browser shows matching options as you type, but any value can still be submitted. No JavaScript validation logic needed; it's a native browser feature.

## Colors still work for a brand-new tag

`categoryColor()` (`lib/categoryColors.ts`) already had a fallback (`CATEGORY_COLORS[category] ?? '#8a8a86'`) from when it was first written — it turned out to already be the right shape for this change with zero modification needed. A never-seen-before tag like `ml-ops` renders in neutral grey instead of crashing or showing `undefined`.

## Verified live

- Confirmed via `\d notes` in psql that `notes_category_check` no longer exists after re-running `schema.sql`.
- Created a note with category `ml-ops` (never used anywhere before) through the admin form — saved successfully with no validation error, no constraint violation.
- Published it and confirmed `/notes` renders `ML-OPS` correctly with the grey fallback color, not an error or a blank label.
- Cleaned up all test data afterward.

## One-line interview answer

> "A field that looked like a fixed enum (CHECK-constrained in the database, a dropdown in the UI) turned out to be better as free text once the actual owner of that data said he'd rather control the taxonomy himself — removing a constraint is still a schema migration, so it got the same idempotent `ALTER TABLE` treatment as adding one, and a `<datalist>` kept autocomplete convenience without reintroducing the restriction."
