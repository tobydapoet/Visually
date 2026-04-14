# FROM node:21-bullseye

# WORKDIR /usr/src/app

# COPY package*.json ./

# RUN npm install --legacy-peer-deps

# COPY . .

# EXPOSE 8087

# CMD ["npm", "run", "start:dev"]


FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# ===== Production =====
FROM node:20-alpine

WORKDIR /app

COPY --from=build /app /app

RUN npm prune --omit=dev

EXPOSE 8087

RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "dist/main.js"]