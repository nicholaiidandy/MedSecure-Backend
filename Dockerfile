FROM node:20 AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --silent
COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/node_modules ./node_modules
ENV NODE_ENV=production
EXPOSE 5000
USER node
CMD ["node", "dist/server.js"]
