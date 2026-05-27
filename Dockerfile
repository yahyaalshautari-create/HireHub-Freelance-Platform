# Base image
FROM node:22

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all project files
COPY . .

# Build NestJS app
RUN npm run build

# Expose port
EXPOSE 4001

# Start app
CMD ["npm", "run", "start:prod"]