FROM node:14 AS ui-build

WORKDIR /usr/src/app
COPY readkit-web/ ./readkit-web/
RUN cd readkit-web && npm install @angular/cli && npm install && npm run build

FROM node:14 AS server-build
WORKDIR /root/
COPY --from=ui-build /usr/src/app/readkit-web/dist ./readkit-web/dist
COPY package*.json ./
RUN npm install
COPY server.js .

EXPOSE 8080

RUN ls

CMD ["node", "server.js"]