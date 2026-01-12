FROM denoland/deno:latest AS builder

WORKDIR /app

COPY deno.json deno.lock ./
RUN deno install --frozen

COPY src ./src

RUN deno cache src/main.ts

FROM denoland/deno:latest AS runtime

WORKDIR /app

COPY --from=builder /app/deno.json ./
COPY --from=builder /app/deno.lock ./
COPY --from=builder /app/src ./src

COPY scripts ./scripts

EXPOSE 8000

CMD ["deno", "run", "--allow-all", "src/main.ts"]
