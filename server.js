const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;
// On Fly.io a persistent volume is mounted at /data (see fly.toml). Falls back
// to the repo's checked-in copy for local/static-only setups.
const DATA_DIR = process.env.DATA_DIR || __dirname;
const DEFAULT_TRIP_PATH = path.join(DATA_DIR, 'default-trip.json');
const SEED_TRIP_PATH = path.join(__dirname, 'default-trip.json');

// Seed the volume on first boot if it doesn't have a default trip yet.
if (DEFAULT_TRIP_PATH !== SEED_TRIP_PATH && !fs.existsSync(DEFAULT_TRIP_PATH)) {
  try { fs.copyFileSync(SEED_TRIP_PATH, DEFAULT_TRIP_PATH); } catch (e) {}
}

app.use(express.json({ limit: '5mb' }));
app.use(express.static(__dirname));

app.get('/api/default-trip', (req, res) => {
  fs.readFile(DEFAULT_TRIP_PATH, 'utf8', (err, data) => {
    if (err) return res.status(404).json({ error: 'No default trip found' });
    res.type('application/json').send(data);
  });
});

app.post('/api/default-trip', (req, res) => {
  const project = req.body;
  if (!project || project.format !== 'rv-timing-project' || !project.trip) {
    return res.status(400).json({ error: 'Not a valid rv-timing-project file' });
  }
  fs.writeFile(DEFAULT_TRIP_PATH, JSON.stringify(project, null, 2), 'utf8', err => {
    if (err) return res.status(500).json({ error: 'Could not save default trip' });
    res.json({ ok: true });
  });
});

app.listen(PORT, '0.0.0.0', () => console.log(`GPX Day Planner running on http://0.0.0.0:${PORT}`));
