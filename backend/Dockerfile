FROM node:16-alpine

WORKDIR /app

# Install build tools needed for bcrypt
RUN apk add --no-cache python3 make g++ 

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 5001

CMD ["npm", "start"]
