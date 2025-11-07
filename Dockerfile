# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available) to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Build the React application for production
RUN npm run build

# Install serve to serve the static build files
RUN npm install -g serve

# Expose port 3000 to allow communication to/from the Txt2MD converter
EXPOSE 3000

# Define the command to run the application
CMD ["serve", "-s", "build", "-l", "3000"]