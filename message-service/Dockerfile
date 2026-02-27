FROM node:20-bullseye

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 8086

CMD ["npm", "run", "start:dev"]
