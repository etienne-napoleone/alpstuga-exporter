# alpstuga-exporter

A simple [Alpstuga](https://www.ikea.com/us/en/p/alpstuga-air-quality-sensor-smart-70609396/) air quality Prometheus exporter for my personal use.

Stack:

- [Bun](https://bun.sh/) - JavaScript runtime
- [Hono](https://hono.dev/) - Web framework
- [Dirigera](https://github.com/lpgera/dirigera) - Unofficial IKEA Dirigera hub API client
- [Pino](https://github.com/pinojs/pino) - Structured logging library

## Usage

> [!TIP]
> Use `bunx dirigera authenticate --no-reject-unauthorized` to authenticate with the Dirigera hub and get a token.

Configuration is done through environment variables.

| Variable              | Description                                            | Default                 |
| --------------------- | ------------------------------------------------------ | ----------------------- |
| `ACCESS_TOKEN`        | Access token for the Dirigera hub                      | Required                |
| `GATEWAY_IP`          | IP address of the Dirigera hub                         | Auto discovery via mDNS |
| `ACCEPT_UNAUTHORIZED` | Accept unauthorized certificates                       | false                   |
| `LOGGING_LEVEL`       | Logging level (trace, debug, info, warn, error, fatal) | error                   |
| `PORT`                | Port to listen on                                      | 9001                    |
| `COLLECT_DEFAULT`     | Collect default metrics                                | false                   |

With bun:

```sh
# Install dependencies
bun i

# Create a .env file with the required variables
touch .env

# With json structured logging
bun start
# or
bun src/index.ts

# With pretty logging
bun dev
```

With docker:

```sh
docker build -t alpstuga-exporter .
docker run -p 9001:9001 --env-file .env alpstuga-exporter
```

## Dashboard

You can find a premade dashboard [here](./provisioning/grafana/dashboards/ikea-alpstuga-air-quality-dashboard.json).

## Local development

You can test the exporter locally through the compose stack:

```sh
# Up
docker compose up -d --build

# Reset
docker compose down && docker volume prune -a
```

- [Grafana](http://localhost:3000)
- [Exporter](http://localhost:9001)
- [Prometheus](http://localhost:9090)
