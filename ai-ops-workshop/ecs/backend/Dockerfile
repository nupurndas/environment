# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Production stage
FROM node:18-alpine

# Install curl and bind-tools (for nslookup)
RUN apk add --no-cache curl bind-tools

WORKDIR /app

COPY --from=builder /app .

EXPOSE 3001

CMD ["node", "server.js"]
