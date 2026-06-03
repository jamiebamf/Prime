# Windows RTK Configuration

RTK executable:

C:\Tools\rtk\rtk.exe

Always use:

C:\Tools\rtk\rtk.exe <command>

for:
- git diff
- git log
- git status
- npm test
- npm run build
- npm run lint
- rg searches

Never execute noisy commands directly.

Keep answers under 150 words unless asked otherwise.

Use concise mode where possible.

## Token Optimization

Before running any command expected to return more than 50 lines:

Use:

C:\Tools\rtk\rtk.exe <command>

Examples:

C:\Tools\rtk\rtk.exe git diff
C:\Tools\rtk\rtk.exe git status
C:\Tools\rtk\rtk.exe git log
C:\Tools\rtk\rtk.exe npm test
C:\Tools\rtk\rtk.exe npm run build
C:\Tools\rtk\rtk.exe npm run lint

Responses should be concise.
Prefer bullet points.
Avoid repeating command output.