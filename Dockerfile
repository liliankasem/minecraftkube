FROM node
RUN mkdir api
COPY files api/
WORKDIR api/
RUN npm install && npm build
CMD [npm, start] 