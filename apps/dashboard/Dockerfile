# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files from the dashboard subfolder
COPY apps/dashboard/package*.json ./
RUN npm install

# Copy ONLY the dashboard source code
COPY apps/dashboard/ . 

# Run the CRA build script
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine
# Copy the custom nginx config
COPY apps/dashboard/nginx.conf /etc/nginx/conf.d/default.conf
# CRA outputs to 'build' folder
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]