FROM node:16-alpine as builder
WORKDIR '/app'

COPY ./package.json ./
RUN npm install

COPY . .

RUN npm run build

FROM nginx
EXPOSE 3000
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html


#Tenemos NGINX en dos partes: como proxy api, que routea las requests al servidor en cuestión, y como servidor específicamente dedicado
#A servir la React App.
#Podríamos tener un solo NGINX server, en vez de dos (uno dedicado a routing y otro dedicado a servir los production files de la React
#App). Sin embargo, hay razones por las cuales es útil tener varios servidores de NGINX. La razón es que en el futuro, por ejemplo
#Podría decidir no servir más los production files a través de un NGINX server, sino de un plain file system storage.

#137. Altering Nginx's Listen Port
#Recordemos que el output de la primera stage (npm run build) será una carpeta adentro de ese app directory llamado Build.
#Entonces luego querremos copiar ese folder a la nginx phase de nuestro build. 
