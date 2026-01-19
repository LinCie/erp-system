.PHONY: restart

restart:
	docker compose down
	docker compose up -d --build
