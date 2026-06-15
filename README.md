# RV Day Timing

A web app for planning the daily timing of a road trip from a GPX route. Upload a
GPX, set a departure time and average driving speed, and the app rolls arrival times
forward across every stop and every day. Built for Class B / RV trip planning where
stops, dwell times, and overnight camps matter.

The UI is a single static HTML/CSS/JS page and can be opened directly in a browser
(it then keeps state in `localStorage`). A small Node/Express server is also included
that serves the page and provides an API to persist the "default" trip to
`default-trip.json` on disk via the **Set as default** button.

### Running the server

```
npm install
npm start
```

Then open `http://localhost:3000`.

### Deploying to Fly.io

The app is set up to run on [Fly.io](https://fly.io) with a persistent volume so the
"default" trip survives deploys and restarts.

```
fly launch    # first time only — creates the app, accept the generated fly.toml
fly volumes create gpxdayplanner_data --size 1 --region iad
fly deploy
```

`default-trip.json` is read from/written to `/data` (a Fly volume), seeded from the
repo's copy on first boot.

## Features

- **GPX upload** — parses waypoints and route geometry entirely in the browser.
- **Automatic day grouping** — any waypoint whose name contains "Night" is treated as
  an overnight stop and ends a day.
- **Per-day timing** — each day starts at the previous day's overnight (the place you
  slept), then drives forward through that day's stops.
- **Editable stop names** — rename any stop inline; the custom name flows through the
  timeline and all exports.
- **Per-stop dwell times** — set how long you linger at each stop; downstream arrival
  times recompute live.
- **Per-day departure override** — each day defaults to the global departure time but
  can be set individually.
- **Meal plan** — free-text breakfast / lunch / dinner notes per day, kept separate
  from the timing math.
- **Trip start date** — anchors the calendar export to real dates.
- **Exports**
  - Copy a single day's schedule to the clipboard (or via an on-screen text box).
  - Calendar `.ics` — two entries per day: one timed event listing all stops, one
    all-day meals event.
  - Print / PDF — full-trip schedule via the system print dialog.
  - Save / Open project — a self-contained `.json` snapshot of the whole plan.

## How distance and time are calculated

**Mileage** comes from the GPX itself, not a maps service. Between each pair of
waypoints the GPX contains a dense sequence of route points tracing the roads. The app
sums the haversine (great-circle) distance between each consecutive pair of points to
approximate the real road distance for that leg. Because the points are closely spaced
along the actual route, summing the small straight-line hops closely tracks true road
distance. If a GPX has waypoints but no route geometry, the app falls back to
straight-line distance between waypoints.

**Drive time** is an estimate: `leg miles ÷ average speed`. The GPX contains no timing
data, so the app derives it from the user's average-speed setting. This is a flat model
and intentionally does not account for terrain, traffic, construction, congestion,
ferries, or border waits. The per-day departure, per-stop dwell, and average-speed
controls exist to adjust this baseline toward reality.

## Project file format

Save Project produces a JSON document with this shape:

```json
{
  "format": "rv-timing-project",
  "version": 1,
  "trip": { "name": "...", "numDays": 18, "stops": [ /* {id, day, name, miles, overnight} */ ] },
  "settings": { "depart": "08:30", "speed": 55, "defdwell": 45, "startdate": "2026-06-18" },
  "dwell": { "<stopId>": 45 },
  "dayDepart": { "<dayIndex>": "06:00" },
  "meals": { "<dayIndex>": { "b": "", "l": "", "d": "" } },
  "customNames": { "<stopId>": "My label" },
  "activeDay": 0
}
```

The full route (including computed leg mileage) is embedded in `trip`, so a project file
is self-contained: opening it restores the entire plan without needing the original GPX.
The GPX is only needed again when changing the route itself.

## Usage

1. Open `rv-timing.html` in a browser.
2. Tap **Upload GPX** and choose a `.gpx` file. (The app loads a sample trip by default.)
3. Set the global departure time, average speed, default stop time, and trip start date.
4. Tap a day tab; set per-stop dwell times, per-day departure, rename stops, add meals.
5. Export via Copy, Calendar, Print, or Save Project.

### Notes on mobile / sandboxed previews

File downloads are blocked inside sandboxed preview frames (e.g. in-app file previews).
The export and save actions therefore also present the data in an on-screen text box with
a Copy button, so the app remains fully usable without a working download. For real file
downloads, open the HTML in a full browser tab.

## GPX expectations

- Waypoints (`<wpt>`) define stops. The `<name>` is used as the stop label.
- A stop whose name contains the word "Night" (case-insensitive) is an overnight and
  ends a day.
- Route legs (`<rte>` with `<rtept>` geometry) are used for accurate mileage when present.

## Tech

Plain HTML, CSS, and vanilla JavaScript in one file. No frameworks, no dependencies, no
storage APIs. State lives in memory for the session; persistence is via the Save/Open
project file.

## Limitations

- Drive times are average-speed estimates, not traffic-aware routing.
- Session state is not persisted automatically; use Save Project to keep a plan.
- The calendar export uses floating (timezone-less) times, which is intentional for a
  trip that crosses time zones ("8:30 AM" means local 8:30 wherever you are).

## License

Add your chosen license here.
