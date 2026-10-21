FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node src ./src
COPY --chown=node:node scripts/promote-admin.js ./scripts/promote-admin.js
RUN mkdir -p /app/runtime/uploads /app/runtime/logs && chown -R node:node /app/runtime
ENV NODE_ENV=production PORT=8080 HOST=0.0.0.0 UPLOAD_ROOT=/app/runtime/uploads LOG_DIR=/app/runtime/logs
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "src/server.js"]
