# Lyrics2Language
App that aims to use song lyrics to teach new languages  

Will be largely coded using Github Copilot for now because this early version will be primarily a proof of concept. Additionally, a secondary reason for this project is for me to practice coding with an AI assistant.

## Start the development services

Install Docker and Node.js, make sure port 5000 is available, then run the
project's startup script from Bash:

```bash
bash ./start-dev.sh
```

The script runs `backend/LibreTranslate/run.sh --load-only en,es` to start
LibreTranslate on port 5000, then starts the Vite frontend. Press Ctrl+C to stop
the frontend and LibreTranslate. On Windows, run the command from Git Bash or
WSL.
