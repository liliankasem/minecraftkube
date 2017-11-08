FROM node
RUN mkdir api
COPY . api/
WORKDIR api/
RUN npm install && npm build
CMD ["npm", "start"]