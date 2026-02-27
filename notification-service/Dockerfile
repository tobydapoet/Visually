FROM node:21-bullseye

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 8087

CMD ["npm", "run", "start:dev"]
