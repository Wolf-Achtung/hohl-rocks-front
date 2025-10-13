FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm i --omit=dev
COPY . .
RUN addgroup -S app && adduser -S app -G app
USER app
EXPOSE 8080
CMD ["node", "server/index.js"]
