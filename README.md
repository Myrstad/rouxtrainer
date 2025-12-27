# ROUX Trainer

A small project for training and learning the speedcubing method ROUX. Started as a way to learn full CMLL, evolved into so much more!

### Local development with docker compose
Preferred method, has hot reloading and good developer experience. 

**Prerequisites:**
 * Docker and Docker Compose

**Setup steps:**
1. Create the `.env` environment file using the terminal.
```
cp .env.example .env
```
2. Use docker and docker compose to start development environment. Note: adding node dependicied needs rebuild and is _not_ hot reloadable.

```
docker compose -f compose.yaml -f compose.dev.yaml up --build -d
```

### Local development without dev compose

**Prerequisites:**
*   Node.js and npm (Node Package Manager)
*   Docker and Docker Compose

**Setup Steps:**


1. Create the `.env` environment file using the terminal.
```
cp .env.example .env
```

2. Use docker and docker compose to spin up database. `docker compose up database --build`, tip omit _database_ for spinning up all services.

3. Startup backend with `backend $` `node` or `nodemon` `server.js`

4. Startup frontend with `frontend $` `npm run dev`

For steps 3 and 4 you may need to install dependencies with `npm install` the first tome

### Production

**Prerequisites:**
 * Docker and Docker Compose
 * Reverse proxy for port `8080`. E.g. `nginx` or `caddy`

**Setup steps:**
1. Run and spin up docker compose. 
```
docker compose up --build -d
``` 