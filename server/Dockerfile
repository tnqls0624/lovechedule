FROM node:latest

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY .. .

RUN npm run build

EXPOSE 80

CMD ["node","/usr/src/app/dist/main.js"]