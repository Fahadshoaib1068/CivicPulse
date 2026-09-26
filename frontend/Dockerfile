FROM node:20.18.0-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:1.27.4-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY config.js /usr/share/nginx/html/config.js
COPY entrypoint.sh /docker-entrypoint.d/30-config.sh

RUN chmod +x /docker-entrypoint.d/30-config.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
