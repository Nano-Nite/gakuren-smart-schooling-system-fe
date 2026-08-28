FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ARG VITE_RSA_PUBLIC_KEY

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_RSA_PUBLIC_KEY=$VITE_RSA_PUBLIC_KEY

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]