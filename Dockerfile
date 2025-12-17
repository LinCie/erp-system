FROM denoland/deno:latest

# Install Sharp native dependencies
RUN apt-get update && apt-get install -y \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY deno.json deno.lock ./
RUN deno install

COPY src ./src

RUN deno cache src/main.ts

EXPOSE 8000

CMD ["deno", "run", "--allow-all", "src/main.ts"]
