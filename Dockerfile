FROM node:latest

RUN apt-get update && apt-get install -y openjdk-7-jre openjdk-7-jdk
RUN npm install -g yarn

RUN mkdir /opt/scraper

WORKDIR /opt/scraper

COPY . /opt/scraper

RUN cd /opt/scraper && yarn install

ENTRYPOINT /opt/scraper/runForever.sh
