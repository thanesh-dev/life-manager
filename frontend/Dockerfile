# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx ng build --configuration=production

# Production stage
FROM nginx:stable-alpine

COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Custom nginx config to handle Angular routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 4299

CMD ["nginx", "-g", "daemon off;"]
