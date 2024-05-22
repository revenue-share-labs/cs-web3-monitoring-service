FROM node:18-slim
WORKDIR /app
# Bundle app source
COPY . .

#temporary solution, delete following lines for CI
RUN npm install
RUN npx prisma generate
RUN npm run build

# Expose port and start application
EXPOSE 3050
CMD ["npm", "run", "start:prod"]
