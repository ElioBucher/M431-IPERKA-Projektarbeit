-- ============================================================
--  Klassen-Informationssystem – Datenbankschema
--  Datei: db/init.sql
--  Ausführen: sqlite3 db/class.db < db/init.sql
-- ============================================================

PRAGMA journal_mode = WAL;   -- Mehrere gleichzeitige Leser erlaubt
PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------
-- Klassen (wird vom Backend / Admin angelegt)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS classes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL UNIQUE,          -- z.B. "IB2024a"
    password_hash TEXT  NOT NULL,                 -- bcrypt-Hash (Elio)
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ----------------------------------------------------------
-- Module (z.B. "Mathematik", "Englisch")
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS modules (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id    INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    name        TEXT    NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(class_id, name)
);

-- ----------------------------------------------------------
-- Hausaufgaben
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS homework (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id   INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title       TEXT    NOT NULL,
    description TEXT,
    due_date    TEXT    NOT NULL,                 -- ISO 8601: "2026-06-15"
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ----------------------------------------------------------
-- Prüfungen
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS exams (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id    INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title        TEXT    NOT NULL,
    exam_date    TEXT    NOT NULL,                -- ISO 8601
    topics       TEXT,                            -- Lernziele / Themen
    created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ----------------------------------------------------------
-- Informationen
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS infos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id   INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title       TEXT    NOT NULL,
    content     TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ----------------------------------------------------------
-- Fragen & Antworten
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id   INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    question    TEXT    NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS answers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer      TEXT    NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ----------------------------------------------------------
-- Testdaten (löschen vor Produktion)
-- ----------------------------------------------------------
-- INSERT INTO classes (name, password_hash) VALUES ('IB2024a', '$2b$12$PLACEHOLDER_HASH');