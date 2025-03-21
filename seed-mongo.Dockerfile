# Use official Mongo image for mongoimport
FROM mongo:6.0

# Copy your manses.json into the container
COPY ./app/mongo/manses.json /data/manses.json

# Set default URI (can be overridden via CLI or ECS environment vars)
ENV MONGO_URI=mongodb://host.docker.internal:27017/saju_db_dev

# Run the import
CMD mongoimport --uri="$MONGO_URI" --collection=manses --file=/data/manses.json --jsonArray
