# AI Paddle Battle — Launch Checklist

## 1. Git Email Privacy (before first push)

Your personal email (`casey.scull@me.com`) is in every commit. Choose one:

- **Option A (easy):** Go to GitHub **Settings > Emails**, enable:
  - "Keep my email addresses private"
  - "Block command line pushes that expose my email"
  - This hides your email on future commits but existing history still shows it
- **Option B (thorough):** Rewrite git history to replace your email:
  ```bash
  # Install git-filter-repo (brew install git-filter-repo)
  git filter-repo --email-callback '
    return email.replace(b"casey.scull@me.com", b"cscull@users.noreply.github.com")
  '
  ```
  This rewrites all commits — you'll need to force push afterward

## 2. Push to GitHub

```bash
git add -A
git commit -m "chore: final polish for open-source launch"
git push origin main
```

## 3. Make the Repo Public

1. Go to **github.com/cscull/AI-Paddle-Battle** > **Settings** (gear icon)
2. Scroll to bottom — **Danger Zone** > **Change repository visibility**
3. Click **Change to public**, confirm

## 4. GitHub Repo Settings

After making public, configure these:

- **About** (top right of repo page, gear icon):
  - Description: `Watch AI models compete in a real-time paddle game with live trash talk`
  - Website: *(leave blank unless you deploy it)*
  - Topics: `ai`, `llm`, `game`, `openai`, `anthropic`, `gemini`, `grok`, `typescript`, `react`, `socket-io`
- **Social preview image** (Settings > General > Social preview):
  - Upload a 1280x640 screenshot of a match in progress
  - This is what shows when you share the GitHub link on LinkedIn/Twitter

## 5. Record Gameplay

### What to capture

Record **3 separate clips**:

1. **Hero clip (10-15 seconds):** A rally between GPT-5.4 vs Claude Sonnet 4.6 — show the ball bouncing, paddles tracking, and a point scored
2. **Trash talk clip (10-15 seconds):** Focus on the trash talk log as messages appear after a point
3. **Full match clip (60-90 seconds):** Setup screen > pick models > match with rallies and trash talk > post-game stats

### Recording setup

- Use **Screen Studio** (Mac, paid, adds auto-zoom and polish) or **OBS Studio** (free)
- Record at **60fps** — the game runs at 60fps so anything lower looks choppy
- Set browser to **full screen** or a clean window with no bookmarks bar
- Pick a **dark desktop wallpaper** to match the game's dark theme
- Close all notifications before recording

### Tips for a good recording

- Use recognizable models: **GPT-5.4 vs Claude Sonnet 4.6** is the matchup people want to see
- Set **points to win: 3** so the match is short
- Set **ball speed: 1.5x** for more exciting rallies
- Wait for a good trash talk line before stopping

## 6. Create the GIF

### From the hero clip

1. Open the 10-15 second hero clip
2. Convert to GIF:
   - **Gifski** (Mac app, best quality): drag video in, set width to 800px, export
   - **ezgif.com** (web): upload video, crop to key moment, resize to 800px wide, optimize
   - **ffmpeg** (CLI):
     ```bash
     ffmpeg -i hero-clip.mov -vf "fps=15,scale=800:-1:flags=lanczos" -loop 0 gameplay.gif
     ```
3. Keep it under **5MB** (GitHub renders GIFs in README but large ones load slowly)
4. Save as `docs/screenshots/gameplay.gif`
5. Uncomment the image tag in README.md:
   ```
   Find the line: <!-- Then uncomment: <p align="center">...
   Replace with: <p align="center"><img src="docs/screenshots/gameplay.gif" alt="AI Paddle Battle gameplay" width="800" /></p>
   ```
6. Commit and push:
   ```bash
   git add docs/screenshots/gameplay.gif README.md
   git commit -m "docs: add gameplay GIF to README"
   git push
   ```

## 7. Create Social Preview Screenshot

1. Take a screenshot of a match in progress (game screen with score, trash talk visible)
2. Crop/resize to **1280x640** (2:1 ratio required by GitHub)
3. Upload at: **Repo Settings > General > Social preview**

## 8. LinkedIn Post

### Format

- **Post type:** Native video (NOT a link post — video gets 5x more reach)
- **Video:** The 60-90 second full match clip (MP4, not GIF)
- **Aspect ratio:** 16:9 or 1:1 (1:1 gets more screen real estate in the feed)

### Post text

Keep it short — the video does the work:

```
I built a game where AI models play each other in real-time — and trash talk after every point.

GPT-5 vs Claude vs Gemini vs Grok... 9 providers, 30+ models.

Each AI gets the game state ~3x/second and decides where to move its paddle. After every point, they roast each other.

Built with TypeScript, React, Socket.IO, and a lot of API calls.

It's open source — link in comments.

#AI #LLM #OpenSource #TypeScript #OpenAI #Anthropic #Google #xAI
```

### Post strategy

- **Post the GitHub link as the FIRST COMMENT**, not in the post body (LinkedIn's algorithm penalizes external links in the main post)
- **Tag companies** in the post text: @OpenAI @Anthropic @Google DeepMind @xAI — they sometimes reshare
- **Best times to post:** Tuesday–Thursday, 8-10am your timezone
- **Engage with comments** in the first hour — the algorithm rewards early engagement

## 9. Optional Extras

- [ ] **Add a demo video to the GitHub release:** Create a GitHub Release (v1.0.0) and attach the video
- [ ] **Post on Twitter/X:** Short clip + "I made AI models play pong and trash talk each other. Open source." with the link
- [ ] **Post on Reddit:** r/programming, r/artificial, r/typescript — use a descriptive title, don't be promotional
- [ ] **Hacker News:** Title format: "Show HN: AI Paddle Battle – Watch LLMs play a paddle game with live trash talk"
- [ ] **Product Hunt:** Good for visibility but requires more prep (screenshots, description, maker profile)
