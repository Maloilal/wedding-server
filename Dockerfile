# Use Node.js LTS
FROM node:20

# Create app directory
WORKDIR /app

# Copy and install dependencies
COPY package.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Expose backend port
EXPOSE 3001

# Start server
CMD ["npm", "start"]

