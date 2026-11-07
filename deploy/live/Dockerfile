# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim
WORKDIR /app
COPY --chown=node:node package.json ./
COPY --chown=node:node trial-server/package.json trial-server/package-lock.json ./trial-server/
RUN --mount=type=secret,id=proxy_ca \
    if [ -f /run/secrets/proxy_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/proxy_ca; fi; \
    npm ci --prefix trial-server --omit=dev --ignore-scripts --strict-ssl=true
COPY --chown=node:node src ./src
COPY --chown=node:node trial-server/auth.ts trial-server/connector.ts trial-server/gateway.ts trial-server/index.ts trial-server/normalizer.ts trial-server/repository.ts ./trial-server/
COPY --chown=node:node trial-server/licenses ./trial-server/licenses
RUN mkdir -p /data && chown node:node /data
USER node
ENV NODE_ENV=production LIVE_BIND_HOST=0.0.0.0 PORT=3002 TRIAL_DATA_DIR=/data
EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node","trial-server/index.ts"]
