# Stage 1: Build the application
FROM node:lts-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Run the application
FROM node:lts-alpine

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/package*.json ./
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /db ./db
COPY --from=build /.db-migraterc ./.db-migraterc

# Set NODE_ENV to production
ENV NODE_ENV=production

RUN npm install --production

EXPOSE 3000

CMD ["npm", "run", "start:prod"]