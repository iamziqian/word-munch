FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY src/ ./src/

EXPOSE 4000

CMD ["npm", "start"]