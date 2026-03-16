FROM node:23-alpine AS build

WORKDIR /app/frontend

COPY package.json package-lock.json ./
COPY . .

RUN npm install
RUN npm run build


FROM nginx:alpine AS production
COPY --from=build /app/frontend/dist /usr/share/nginx/html



FROM node:23-alpine AS dev

WORKDIR /frontend

COPY package.json package-lock.json ./
COPY . .

RUN npm install
COPY --from=build /app/frontend/dist /frontend/dist

CMD ["npm", "run", "preview", "--", "--port", "80", "--host", "--watch"]