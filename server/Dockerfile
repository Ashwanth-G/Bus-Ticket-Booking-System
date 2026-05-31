# Build Node Environment
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Generate Prisma Client code
RUN npx prisma generate --schema=src/prisma/schema.prisma

EXPOSE 5000

CMD ["npm", "run", "start"]
