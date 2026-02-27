# FROM node:21-bullseye

# WORKDIR /usr/src/app

# COPY package*.json ./

# RUN npm install --legacy-peer-deps

# COPY . .

# EXPOSE 8085

# CMD ["npm", "run", "start:dev"]

FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=build /app/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

COPY --from=build /app/dist ./dist

EXPOSE 8085

CMD ["node", "dist/main.js"]