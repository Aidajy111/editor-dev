# editor-front/Dockerfile

FROM nginx:1.27-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run buildа
FROM nginx:1.27-alpine
COPY dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
