FROM node:current-alpine

RUN cat /usr/local/bin/docker-entrypoint.sh

COPY ./entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN  chmod +x /usr/local/bin/docker-entrypoint.sh

WORKDIR /var/www