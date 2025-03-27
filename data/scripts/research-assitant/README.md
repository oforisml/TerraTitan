# research-assitant

[ref](https://mastra.ai/docs/guides/04-research-assistant)

To install dependencies:

```bash
bun install
```

## PgVector

```bash
docker run --name pgvector -e POSTGRES_HOST_AUTH_METHOD=trust -d -p 5433:5432 pgvector/pgvector:pg17
createdb -h 127.0.0.1 -p 5433 -U postgres mastrarag
```

To run:

```bash
bun run src/index.ts
```

This project was created using `bun init` in bun v1.2.5. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
