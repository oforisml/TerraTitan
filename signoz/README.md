# Mastra Observability

> with self-hosted Signoz (0.80.0)

## Set up

Based on [signoz/signoz/deploy/install.sh](https://github.com/SigNoz/signoz/blob/v0.80.0/deploy/install.sh)

Prepared downloading the `deploy` subdirectory:

```console
cd ../data/scripts/github-subdirectory
❯ bun run src/index.ts zip SigNoz signoz deploy ./download/signoz v0.80.0
```

## Requirements

- [docker compose](https://docs.docker.com/compose/install/) (>= v2.18.1)
