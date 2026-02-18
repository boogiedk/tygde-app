# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Build arguments for environment variables
ARG REACT_APP_API_URL=
ARG REACT_APP_YANDEX_MAPS_KEY=

# Set as env vars for the build
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_YANDEX_MAPS_KEY=$REACT_APP_YANDEX_MAPS_KEY

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:stable-alpine AS production

# Copy build files
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
