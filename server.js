const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DEFAULT_TRIP_PATH = path.join(__dirname, 'default-trip.json');

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

app.listen(PORT, () => console.log(`GPX Day Planner running on http://localhost:${PORT}`));
