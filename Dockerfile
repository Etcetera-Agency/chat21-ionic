### STAGE 1: Build ###

# We label our stage as ‘builder’
FROM --platform=linux/arm64/v8 node:14.21.2-alpine as builder

RUN apk add --no-cache curl

# Install build dependencies
RUN apk add --no-cache \
    build-base \
    automake \
    autoconf \
    libtool \
    nasm \
    zlib-dev \
    libjpeg-turbo-dev \
    libpng-dev \
    libwebp-dev \
    giflib-dev \
    libexif-dev \
    libxml2-dev \
    glib-dev \
    expat-dev

# Download and extract libvips source code
RUN curl -LO https://github.com/libvips/libvips/releases/download/v8.9.1/vips-8.9.1.tar.gz \
    && tar xf vips-8.9.1.tar.gz \
    && rm vips-8.9.1.tar.gz

# Build and install libvips
RUN cd vips-8.9.1 \
    && ./configure \
    && make \
    && make install \
    && ldconfig

# Continue with the rest of your Dockerfile

ENV PYTHON /usr/local/bin/python3

RUN npm install -g ionic cordova@8.0.0

WORKDIR /app

COPY . ./

RUN npm install

RUN mkdir -p ./www

RUN cordova platform add browser@latest

RUN ionic cordova build browser

### STAGE 2: Setup ###

FROM nginx:1.14.1-alpine

## Copy our default nginx config
COPY nginx.conf /etc/nginx/nginx.conf

## Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/platforms/browser/www/ /usr/share/nginx/html
COPY --from=builder /app/src/chat-config-template.json /usr/share/nginx/html
COPY --from=builder /app/src/firebase-messaging-sw-template.js /usr/share/nginx/html

WORKDIR /usr/share/nginx/html

RUN echo "Chat21 Ionic Started!!"

CMD ["/bin/sh",  "-c",  "envsubst < /usr/share/nginx/html/chat-config-template.json > /usr/share/nginx/html/chat-config.json && envsubst < /usr/share/nginx/html/firebase-messaging-sw-template.js > /usr/share/nginx/html/firebase-messaging-sw.js && exec nginx -g 'daemon off;'"]
