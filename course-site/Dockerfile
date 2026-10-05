FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Vite bakes VITE_* values into the static files at build time. Railway passes
# the service's variables in as build args with these names.
ARG VITE_SITE_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_UMAMI_WEBSITE_ID
ARG VITE_CONTACT_EMAIL
ENV VITE_SITE_URL=$VITE_SITE_URL \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_UMAMI_WEBSITE_ID=$VITE_UMAMI_WEBSITE_ID \
    VITE_CONTACT_EMAIL=$VITE_CONTACT_EMAIL

COPY . .
RUN npm run build


FROM nginx:1.27-alpine

# The nginx image fills ${PORT} in templates at start-up; Railway sets PORT.
ENV PORT=8080
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
