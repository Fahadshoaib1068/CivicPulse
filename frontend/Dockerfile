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

RUN sed -i 's/\r$//' /docker-entrypoint.d/30-config.sh \
    && sed -i 's/^[[:space:]]*pid[[:space:]].*;/pid \/tmp\/nginx.pid;/' /etc/nginx/nginx.conf \
    && chmod +x /docker-entrypoint.d/30-config.sh \
    && mkdir -p /var/cache/nginx /var/run /var/log/nginx \
    && chown -R nginx:nginx /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html /docker-entrypoint.d \
    && touch /usr/share/nginx/html/config.js \
    && chown nginx:nginx /usr/share/nginx/html/config.js \
    && chmod 644 /usr/share/nginx/html/config.js \
    && chmod 755 /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html /docker-entrypoint.d

USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
