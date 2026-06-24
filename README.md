# KAEDE — Koneksi Automated Environment DE

Trello Power-Up connector for environment management. Deployed on Netlify.

## Structure

```
├── index.html      # Iframe connector (loaded by Trello)
├── board.html      # Dashboard popup
├── card.html       # Card environment manager
├── auth.html       # Authorization page
├── js/kaede.js     # Power-Up capabilities
├── css/style.css   # Styling
├── netlify.toml    # Netlify config
└── _redirects      # Redirect rules
```

## Deploy to Netlify

1. Push this repo to GitHub
2. Connect repo to Netlify
3. Use the Netlify URL as the iframe connector URL in Trello Power-Up admin

## Trello Capabilities

- **Board Button** — Opens KAEDE dashboard
- **Card Button** — Set environment per card
- **Card Badge** — Shows env status on card front
- **Show Card** — Detailed env info in card detail view
- **Authorization** — OAuth/API key flow
