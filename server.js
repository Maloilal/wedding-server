import express from 'express'
import cors from 'cors'
import sqlite3 from 'sqlite3'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = process.env.PORT || 5173

app.use(cors())
app.use(express.json())

const db = new sqlite3.Database('./db.sqlite')

// Создаем таблицу для RSVP
db.run(`
  CREATE TABLE IF NOT EXISTS rsvp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    guests INTEGER,
    attending TEXT,
    created_at TEXT
  )
`)

// Создаем таблицу для спутников
db.run(`
  CREATE TABLE IF NOT EXISTS rsvp_companions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rsvp_id INTEGER,
    name TEXT,
    FOREIGN KEY(rsvp_id) REFERENCES rsvp(id)
  )
`)

// Обработчик POST-запроса для сохранения RSVP
app.post('/api/rsvp', (req, res) => {
  const { name, email, guests, attending, companions } = req.body;
  const createdAt = new Date().toISOString();

  // Сохранение RSVP
  db.run(
    `INSERT INTO rsvp (name, email, guests, attending, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [name, email, guests, attending, createdAt],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      // Сохранение спутников
      companions.forEach((companion) => {
        db.run(
          `INSERT INTO rsvp_companions (rsvp_id, name)
           VALUES (?, ?)`,
          [this.lastID, companion],  // Здесь записываем полное имя спутника
          (err) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
          }
        );
      });

      res.json({ success: true, id: this.lastID });
    }
  );
});
// Обработчик GET-запроса для получения RSVP
app.get('/api/rsvp', (req, res) => {
  db.all(
    `SELECT * FROM rsvp ORDER BY created_at DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message })

      // Для каждого RSVP-запроса получаем спутников
      const rsvpWithCompanions = rows.map((rsvp) => {
        return new Promise((resolve, reject) => {
          db.all(
            `SELECT name FROM rsvp_companions WHERE rsvp_id = ?`,
            [rsvp.id],
            (err, companions) => {
              if (err) reject(err)
              resolve({ ...rsvp, companions: companions.map((c) => c.name) })
            }
          )
        })
      })

      // Ждем, пока все спутники будут добавлены к RSVP
      Promise.all(rsvpWithCompanions)
        .then((result) => res.json(result))
        .catch((err) => res.status(500).json({ error: err.message }))
    }
  )
})

app.listen(port, () => {
  console.log(`RSVP backend listening at http://localhost:${port}`)
})
