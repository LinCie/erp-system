FROM denoland/deno:alpine

WORKDIR /app

COPY deno.json deno.lock ./
RUN deno install

COPY src ./src

RUN deno cache src/main.ts

EXPOSE 8000

CMD ["deno", "run", "--allow-net", "--allow-env", "src/main.ts"]
