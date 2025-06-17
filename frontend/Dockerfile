FROM node:20-alpine AS build

WORKDIR /app/frontend

COPY package.json package-lock.json ./
COPY . .

RUN npm install
RUN npm run build


FROM nginx:alpine AS production
COPY --from=build /app/frontend/dist /usr/share/nginx/html



FROM node:20-alpine AS dev

WORKDIR /app/frontend

COPY package.json package-lock.json ./
COPY . .

RUN npm install

CMD ["npm", "run", "dev"]