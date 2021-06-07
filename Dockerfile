FROM node:14 AS ui-build

WORKDIR /home/app
COPY readkit-web/ ./readkit-web/
RUN cd readkit-web && npm install @angular/cli && npm install && npm run build

FROM node:14 AS server-build
WORKDIR /root/
COPY --from=ui-build /home/app/readkit-web/dist ./readkit-web/dist
COPY package*.json ./
RUN npm install
COPY server.js .

EXPOSE 8080

CMD ["node", "server.js"]