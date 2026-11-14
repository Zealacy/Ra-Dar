# Ra-Dar tools (for Claude sessions)

Helper scripts used to test, audit, research and publish the site. They are **not part of the website**: the deploy copies only the site files, so nothing in this folder goes live. They contain no IDs, tokens or personal details; keep it that way (the GitHub backup is public).

All browser scripts use the sandbox's pre-installed Playwright and go through the proxy (`proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' }`). Most expect the local server:

```bash
cd <repo> && setsid nohup python3 -m http.server 8765 > /dev/null 2>&1 &
```

(It dies when the container restarts; start it again.) **Open-Meteo allows 10,000 requests a day per IP, and every full page load uses many.** Run the full test sparingly, and pick mountains with `MTNS=`.

## test/

| Script | What it does |
|---|---|
| `test.js` | **The main browser test.** Each mountain, desktop (1280 px) and phone (iPhone 13): preseason view, every tab, then the ski-day view; screenshots plus a JSON report (sources loaded, page errors, failed requests, CSP violations, cam sizes, briefing text). `MTNS=bachelor,skibowl VIEWS=desktop,phone TABS=1 node tools/test/test.js [baseUrl] [outDir]`. Defaults: all mountains, local server, `./shots`. Use `https://ra-dar-alpha.vercel.app/` as baseUrl for the live check. |
| `keys.js` | Reads the mountain keys from `mountains.js` (used for defaults). |
| `slowtest.js` | Holds one source back 9 s (in the test only) and logs when each part of the page appears and what the "Taking longer than usual" note says. `SCEN=normal,snow,ens,nws`. |
| `firstdraw.js` | Fresh visit to the **live** site on a simulated 4G phone: time to the main chart, to everything, and to the first cam request. |
| `hourscheck.js` | Per-mountain ski hours with a fake clock (Skibowl nights, Appalachian to midnight, Bachelor 9–4). Blocks Open-Meteo to save the allowance. |
| `embedcheck.js` | Skibowl's no-still live player (`embed` cam): dark panel, play button, Nest iframe on tap, no CSP errors. |
| `precheck.js` | Preseason "coming" snow by elevation vs. the deterministic model and the 82-run range. |

## audit/ (the Nov 10 data audit; re-run after any change to how numbers are computed)

1. `node tools/audit/capture.js <outDir> [mtn,mtn]`: loads each mountain locally, saves every raw response and a snapshot of what the page computed.
2. `python3 -I tools/audit/audit.py <outDir> [mtn ...]`: recomputes every displayed number independently from the raw responses and prints `MISMATCH` lines (anything else is information).
3. `python3 -I tools/audit/meta.py <outDir>`: checks the facts in `mountains.js` (station/SNOTEL/ECCC elevations, NWS cells, distances) against each source's own records.

Written for the first five mountains; it now follows each mountain's `skiHours`. Mountains added later (Mission Ridge onward) were verified at build time but not through this audit; run it on them before trusting it blindly, and fix the audit (not the site) if it doesn't understand a newer setting.

## research/

| Script | What it does |
|---|---|
| `stations-near.py STATE lat,lon [lat,lon]` | Every NWS-listed station within 10 miles, with elevation and distance. |
| `obs.py ID [ID ...]` | Freshness of each station's last 48 reports and which fields it actually sends (temperature, wind, gust, direction, humidity). |
| `model-check-spokane.py`, `model-check-appalachian.py` | How far Open-Meteo's hourly temperature is from measured stations over 7 days (the evidence behind `nowModel: true`). Copy one and change the stations for a new mountain. |

## preview/

`make.py` writes `preview.html` (the general dawn-mountain link preview, no live data, no names); `node shot.js` renders it to `preview.png` (1200×630). Copy the result to the repo root and bump `?v=` on the `og:image` tags in `index.html`.

## deploy.sh

`bash tools/deploy.sh` publishes the site to Vercel and then checks that the live files match. Only after the checks in CLAUDE.md "Publishing" pass, and only for the owner's requested changes. See the comments at the top of the script.
