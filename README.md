# Booth — YouTube auto-DJ

A single-file web app that DJs YouTube for you: load a playlist or search for
songs, and it plays through the queue with smooth equal-power crossfades
between tracks, two-deck style. No scraping, no fragile selectors — it sits on
YouTube's official IFrame Player API.

## Run it

Easiest (recommended — avoids `file://` quirks with the YouTube player):

```
cd C:\Users\Abhinav\Downloads\youtube-autodj
python -m http.server 8080
```

Then open **http://localhost:8080** in Chrome. (Double-clicking `index.html`
often works too; if the video area stays black, use the server command.)

## Two modes

**Add by link — works immediately, no key.**
Paste any YouTube link into "Add by link": a single video link (watch,
youtu.be, or Shorts) queues that one song; a *public* playlist link imports
the whole list in order. Titles fill in a few seconds after adding. Private
playlists and auto-generated "Mix" playlists can't be read.

**Search mode — needs a free YouTube API key (~5 min, no billing).**
1. Go to https://console.cloud.google.com/ and sign in.
2. Create a project (any name).
3. "APIs & Services" → "Library" → search **YouTube Data API v3** → Enable.
4. "APIs & Services" → "Credentials" → "Create credentials" → **API key**. Copy it.
5. Paste it into the key field under the search box in the app → Save key.

The key is stored only in your browser's localStorage, never sent anywhere
except Google. Free quota is 10,000 units/day; a search costs 100 units, so
roughly 100 searches a day. With a key saved, playlist import also switches to
the API (faster, proper titles).

## Using it

- Add tracks (search, link, or playlist), press **Start the set**.
- Singles you add (search results or pasted video links) slot in **right after
  the current song**; several adds in a row keep their order. Playlists append
  to the end.
- **Per track** caps how long each song plays (1:00–4:00, or full song) — the
  crossfade to the next track fires at the cap, radio-style.
- **Crossfade** slider sets the overlap (0 = hard cuts). The deck meters show
  the handover live.
- **Skip** fades straight to the next track; **Play now** on any queue row
  jumps to it; **Shuffle upcoming** reorders only what hasn't played.
- Videos that block embedding are struck through and skipped automatically.
- Queue, settings, and key persist across reloads (same browser).

## Tempo detection & smart switching

The app learns each track's tempo in the background (watch the amber BPM
chips appear on queue rows), trying in order:

1. **Deezer's public catalog** — a keyless lookup by cleaned-up title; many
   tracks have an editorial BPM there.
2. **Real audio analysis** — if the catalog has no BPM but offers a 30-second
   preview clip, the app downloads the clip and estimates tempo in your
   browser (onset autocorrelation via Web Audio).
3. Title keywords, as before, if both fail.

With a BPM known and **Switch: On phrase** (the default), a capped cutover
doesn't fire at the raw clock time — it snaps back to the end of the last
complete 8-bar phrase (32 beats), so transitions land where a DJ would take
them. Detected BPMs also feed the built-in planner and both Claude prompts.

Honest caveats: title-to-catalog matching can miss or mismatch (covers,
remixes); preview analysis is an estimate; and phrase snapping assumes the
beat grid starts at 0:00, which long intros can shift — close, not perfect.
True beat-accurate mixing would need the actual audio stream, which YouTube
doesn't expose.

## Better transitions

Four things now shape every handover, not just a timer:

- **Auto fade (on by default):** each pair of songs gets its own transition.
  Tempos within ~4% → a long 16-beat blend; within ~9% → a short blend;
  a real tempo jump → a quick 1-second cut, because overlapping clashing
  tempos is what makes blends sound muddy. The status bar narrates each
  decision ("quick cut — tempo jump (92 → 128 bpm)"). Untick Auto fade to
  go back to the fixed slider length.
- **Loudness leveling:** Deezer's ReplayGain value pulls hot masters down
  toward a common level so one track doesn't blast over the next. The player
  can only turn down, not up, so it narrows jumps rather than erasing them.
- **Intro skip:** start incoming songs ~8 or ~16 bars in (BPM-scaled), past
  talky or ambient intros — big for radio-style capped sets. Approximate by
  nature; leave Off for albums you want intact.
- **Phrase snapping** (from before) still times the cutover to the end of an
  8-bar phrase.

Best-sounding combo for a party: Per track 2:00–3:00, Switch on phrase,
Auto fade on, Intro skip 8 bars, and a Claude-planned order so neighbouring
tracks already sit close in tempo — then most fades become long blends.

## On an Android phone

Booth is a PWA — no APK or Play Store needed. Get the folder onto the web
over HTTPS, then install it from Chrome:

**Recommended: free hosting on GitHub Pages (one-time, ~10 min)**
1. Create a free account at https://github.com, then: New repository → name it
   `booth` → Public → Create.
2. On the repo page: "uploading an existing file" → drag in `index.html`,
   `manifest.json`, `sw.js`, and the `icons` folder's two PNGs (recreate the
   `icons/` folder by naming them `icons/icon-192.png` etc. in the upload
   path) → Commit.
3. Settings → Pages → Branch: `main`, folder `/ (root)` → Save. After a
   minute your app is live at `https://<yourname>.github.io/booth/`.
4. On the phone: open that URL in Chrome → menu (⋮) → **Add to Home screen**
   → Install. Launches full-screen with its own icon.

**Quick test without hosting (same Wi-Fi):** run the server on the PC
(`py -m http.server 8080`), find the PC's address with `ipconfig` (IPv4,
e.g. 192.168.1.5), and open `http://192.168.1.5:8080` on the phone. Allow
Python through the Windows firewall prompt. Clipboard-based features need
HTTPS, so Copy prompt may not work this way — hosting fixes that.

**Phone realities:**
- The screen must stay on — YouTube's mobile web player pauses when the
  screen locks (background audio is a YouTube Premium app feature). Booth
  requests a screen wake lock while a set is running, so the phone won't
  doze off on its own; dim the brightness and plug it in, DJ-booth style.
- Audio follows the phone, so Bluetooth speakers work normally.
- Queue, keys, and settings are per device (browser storage) — the phone
  won't see what you set up on the PC.
- Streaming video uses mobile data if you're not on Wi-Fi.

## Honest limits

- Crossfades are volume blends, not BPM-matched beatmixing — the IFrame API
  doesn't expose the audio stream, and extracting it would breach YouTube's
  terms. For songs-flowing-into-songs at a gathering, this is most of the
  perceived effect.
- Playback follows YouTube rules: ads play if YouTube serves them (Premium
  accounts in the same browser remove them), and some labels block embedding.

## AI set planning

Type a vibe above the queue (e.g. "deep house warm-up into peak time") and
press **Plan the set**. It works three ways, best-available first:

1. **No key, instant (default).** A built-in planner scores each track's
   energy from its title (remix/club vs acoustic/slowed etc.), builds an arc —
   rise to a late peak, land gently — and spaces out same-artist tracks.
2. **No key, Claude-quality.** Press **Copy prompt**: a ready-made planning
   prompt with your tracklist lands on the clipboard. Paste it into Claude
   (claude.ai — free), then paste the numbers it returns into the box that
   appears and press **Apply order**.
3. **One click with a key (optional).** Save an Anthropic API key
   (console.anthropic.com → API keys) and Plan the set calls Claude directly
   (model: claude-sonnet-5-5). The key is stored only in your browser and sent only to Anthropic. Each plan
is one small API call (model: claude-sonnet-5-5). The current and
already-played tracks are never touched; unplayable tracks are pushed to the
end.
