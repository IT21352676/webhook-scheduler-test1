# Use an official Node.js runtime as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the entire project into the container
COPY . .

# Expose the port your application runs on
EXPOSE 3000

# Command to run your application
CMD ["node", "server.js"]
