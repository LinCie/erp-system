FROM denoland/deno:alpine

RUN apk add --no-cache libstdc++ libgcc

WORKDIR /app

COPY deno.json deno.lock ./
RUN deno install

COPY src ./src

RUN deno cache src/main.ts

EXPOSE 8000

CMD ["deno", "run", "--allow-all", "src/main.ts"]
