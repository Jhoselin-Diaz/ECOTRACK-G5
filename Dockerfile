# Etapa 1: Compilación
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

# Etapa 2: Servidor Web Nginx
FROM nginx:alpine
# Copia los archivos compilados. En Angular 17+ la ruta suele ser dist/[nombre-proyecto]/browser
COPY --from=build /app/dist/ecotrack-g5/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
