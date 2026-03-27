# Mobile App (Expo)

## Recommended Environment

- Node.js: 20.x LTS (recommended)
- npm: 10.x

The project currently targets Expo SDK 54. On Windows, using Node 22 can intermittently cause Metro worker failures such as:

`Error: spawn UNKNOWN`

## Start Commands

- `npm run start`: stable mode (`expo start --clear --max-workers 1`)
- `npm run start:default`: default Expo startup (no worker limit)

## If You Still See `spawn UNKNOWN`

1. Switch Node to 20 LTS.
2. Remove cache and reinstall dependencies:
	- `rd /s /q node_modules`
	- `del package-lock.json`
	- `npm install`
3. Run again with `npm run start`.
