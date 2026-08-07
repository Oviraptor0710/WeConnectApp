FROM node:18-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package.json package-lock.json* ./
RUN npm install

# Copy all source files
COPY . .

# Expose port
EXPOSE 3000

# Run the application
CMD ["npm", "start"]
