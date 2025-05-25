# Base Stage
FROM node:20-bullseye AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Dev Build Stage 
FROM base AS devbuild
COPY . .
COPY .env .env
RUN npm run build

# Prod Build Stage 
FROM base AS prodbuild
COPY . .
COPY .env .env
RUN npm run build

# Dev Runtime
FROM nginx:1.25-alpine AS dev
LABEL author="VibeTribe DevOps"
COPY --from=devbuild /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Prod Runtime
FROM nginx:1.25-alpine AS prod
LABEL author="VibeTribe DevOps"
COPY --from=prodbuild /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


