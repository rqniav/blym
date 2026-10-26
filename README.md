# Blym

**Is this water safe?** Blym helps people check small lakes and ponds for signs of toxic algae (harmful cyanobacteria blooms).

Built by Rania Sherwani, Gwinnett School of Mathematics, Science and Technology, for the 2026 Congressional App Challenge (GA-04).

## The problem

Toxic algae blooms can make people sick and kill dogs within hours. EPA satellites only monitor about 2,000 of the largest U.S. lakes, so small neighborhood lakes and ponds, like the one in front of my house in Gwinnett County, have no one watching. Existing apps (like the EPA's bloomWatch) let you *report* a bloom once you already know it is one. Blym helps the person standing at the water figure out whether it's dangerous and what to do right now.

## Features

- **AI photo check:** take a photo of the water. The AI describes the water color, whether scum is visible, and whether it looks like a harmless look-alike (pollen, duckweed, filamentous algae, mud).
- **Smart checklist:** what the AI spots is pre-checked; the user confirms or corrects it and adds smell and recent weather.
- **Risk score:** photo result + checklist become a 0-10 score and a High / Moderate / Low risk level with clear advice.
- **Community map:** reports are saved and shown as colored pins around Gwinnett County. Neighbors can tap "I see it too" or "It's gone," so old reports fade out.
- **Report to the state:** after saving, the app shows Georgia EPD's contact info and what details to include.
- **Pet safety:** prevention tips, rinse steps, warning signs, and ASPCA Animal Poison Control.
- **Learn:** what blooms are, why small Georgia lakes are at risk, look-alikes, the stick test, myths, and prevention.

## How the risk score works

Found in `index.html`, functions `photoScore()` and `computeRisk()`:

| Signal | Points |
|---|---|
| Photo looks like a harmful bloom | 2 (low confidence), 3 (medium), 4 (high) |
| Photo unclear | 1 |
| Green, blue-green, or paint-like water | +2 |
| Scum or film | +2 |
| Bad smell | +1 |
| Hot and dry weather lately | +1 |

5 or more points = **High**, 2 to 4 = **Moderate**, 0 to 1 = **Low**.

## Tech

- **Front end:** one web page (`index.html`) in HTML, CSS, and JavaScript, hosted free on GitHub Pages. Works on any phone browser and can be added to the home screen.
- **Map:** Leaflet with OpenStreetMap.
- **Database:** Supabase (Postgres). Row-level security lets anyone read and add reports, but nobody can edit or delete them; votes go through a locked-down `vote()` function. See `supabase/setup.sql`.
- **AI photo check:** a Supabase Edge Function (`supabase/functions/analyze/index.ts`) sends the photo to Google Gemini with instructions written for algae blooms and their look-alikes. The API key stays secret on the server.
- **Built-in color analysis:** if the AI is unavailable, Blym analyzes the photo on the phone itself. It converts pixels to hue, saturation, and brightness and measures how much of the colorful area is bloom-colored (bright green, blue-green), pollen-colored (yellow), or mud-colored (brown). See `colorAnalyze()` in `index.html`.

## Setup

1. **Supabase:** create a project, open SQL Editor, paste `supabase/setup.sql`, and run it.
2. **AI function:** in Supabase, go to Edge Functions, create a function named `analyze`, paste `supabase/functions/analyze/index.ts`, and deploy. Add a secret named `GEMINI_API_KEY`.
3. **Config:** put your Supabase Project URL and anon public key in `config.js`.
4. **Hosting:** GitHub repo Settings > Pages > Deploy from branch `main`, folder `/ (root)`.

## Safety note

Blym is a safety awareness tool, not a water test. You can't tell if algae is toxic just by looking. When in doubt, stay out.

## Sources

Georgia EPD, CDC, EPA, and USGS guidance on harmful algal blooms. Learn-page photos: USGS (public domain).
