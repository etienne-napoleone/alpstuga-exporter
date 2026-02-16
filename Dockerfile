FROM oven/bun:1-alpine

LABEL org.opencontainers.image.source="https://github.com/etienne-napoleone/alpstuga-exporter"

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY src ./src
COPY tsconfig.json ./

ENV PORT=9001
EXPOSE 9001

ENTRYPOINT ["bun"]
CMD ["src/index.ts"]
