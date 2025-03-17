# Use a newer Node.js version (Node 18 recommended)
FROM --platform=linux/amd64 node:18-alpine 

# Set timezone
RUN apk add --no-cache tzdata 
ENV TZ Asia/Seoul

# Set working directory
WORKDIR /home/app 

# Copy package.json and package-lock.json first (for efficient Docker caching)
COPY package.json package-lock.json ./ 

# Install dependencies (only production dependencies for smaller image size)
RUN npm install --only=production 

# Copy the rest of the app
COPY . . 

# Expose the app's port (optional, but good practice)
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start"]
