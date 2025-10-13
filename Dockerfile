FROM node:22-alpine

WORKDIR /app
COPY server ./server
COPY public ./public
COPY package.json ./

RUN npm ci --omit=dev

EXPOSE 8080
CMD ["node", "server/index.js"]
