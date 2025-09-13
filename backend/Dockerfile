FROM node:20-alpine AS build

WORKDIR /app/backend

COPY package.json package-lock.json ./
COPY . .

RUN npm install

FROM node:20-alpine AS production

COPY --from=build /app/backend/ /app/backend/

WORKDIR /app/backend

CMD [ "npm", "run", "start" ]