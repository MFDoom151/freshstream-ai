FROM node:20-alpine

WORKDIR /app

COPY package.json ./
# tg-bot has no external production dependencies, but run install if added
RUN npm install --omit=dev || true

COPY . .

ENV NODE_ENV=production
ENV BACKEND_URL=http://web:3000

CMD ["node", "src/index.js"]
