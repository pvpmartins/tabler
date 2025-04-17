FROM cypress/browsers:node-22.14.0-chrome-133.0.6943.53-1-ff-135.0-edge-133.0.3065.59-1

# Set the working directory inside the container
WORKDIR usr/src/app

RUN npm i -g sass
RUN apt update && \
    apt install -y openjdk-17-jdk openjdk-17-source netcat-traditional 
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y make g++ && apt-get clean
RUN npm i -g java --unsafe-perm
RUN npm install ts-node typescript jest nodemon
RUN npm install -g fern-api
RUN chmod +x /usr/local/lib/node_modules/java && \
    npm rebuild
ARG VITE_BACKEND_URL

ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
# Copy package.json and package-lock.json (if available)

# Install dependencies
