# Local Database Tooling

The official local tooling is exposed through npm scripts from `server`:

```bash
npm run db:local:create
npm run db:local:reset -- --yes
```

## Safety

- Only `localhost`, `127.0.0.1` and `::1` are allowed.
- Remote hosts are rejected before any connection attempt.
- `db:local:reset` is destructive and requires `--yes`.
- Passwords are passed through `MYSQL_PWD` to the child process and are never printed.
- The tool imports only `generated/cajora_v1_0_full.sql`.

## Requirements

A local `mysql` or `mariadb` client must be available in `PATH`.

The tool reads:

```text
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
```

Do not use this tooling for production, Hostinger or any remote database.
