FROM node:23-alpine3.20 AS builder

WORKDIR /app

COPY package.json ./

#RUN npm install
RUN npm install --legacy-peer-deps

COPY . .

RUN npx vite build --logLevel error || (npx vite build 2>&1 | grep "failed to resolve")
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]