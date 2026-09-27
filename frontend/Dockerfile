FROM node:20.18.0-alpine AS build

WORKDIR /app

RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5

COPY package*.json ./
RUN npm ci --prefer-offline --no-audit

COPY . .
RUN npm run build

FROM nginx:1.27.4-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY config.js /usr/share/nginx/html/config.js
COPY entrypoint.sh /docker-entrypoint.d/30-config.sh

# Strip Windows CRLF line endings natively using sed and grant execute permissions
RUN sed -i 's/\r$//' /docker-entrypoint.d/30-config.sh && \
    chmod +x /docker-entrypoint.d/30-config.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]