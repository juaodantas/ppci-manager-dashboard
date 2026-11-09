"""Local-only HTTP/Postgres regressions. Python stdlib; never deletes fixtures.

Run with local Supabase running and PPCI_TEST_PASSWORD in the environment:
  python3 supabase/functions/api/tests/quote_edit_local.py
Docker must be accessible (e.g. run under `sg docker`). Tokens stay in memory.
Every run creates its own TESTE EDIÇÃO customer/companies/quotes/projects.
Concurrency uses an independent psql row lock and two Deno repository processes
(the HTTP runtime shares a max:1 pool, so concurrent HTTP alone is insufficient).
pg_stat_activity must prove both sessions wait before the lock is released.
Requires Docker image denoland/deno:alpine-2.2.5 and outbound dependency access.
"""

import concurrent.futures
import getpass
import json
import os
from pathlib import Path
import subprocess
import time
import urllib.error
import urllib.request
import uuid


BASE = "http://127.0.0.1:54321/functions/v1/api"
DB = "supabase_db_manager-dashboard"
PSQL = ["docker", "exec", "-i", DB, "psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres"]
TOKEN = None
FIXTURES = []


def sql(statement):
    return subprocess.run(PSQL, input=statement, text=True, capture_output=True, check=True).stdout.strip()


def request(method, path, body=None, expected=200):
    data = body if isinstance(body, bytes) else (json.dumps(body).encode() if body is not None else None)
    headers = {"Content-Type": "application/json"}
    if TOKEN:
        headers["Authorization"] = "Bearer " + TOKEN
    req = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=40) as response:
            status, raw = response.status, response.read().decode()
    except urllib.error.HTTPError as error:
        status, raw = error.code, error.read().decode()
    assert status == expected, (method, path, status, expected, raw)
    if status == 500:
        return raw
    result = json.loads(raw)
    if status in (400, 404):
        assert isinstance(result.get("error"), str), result
        assert not any(word in result["error"] for word in ("INSERT INTO", "UPDATE quotes", "violates foreign key")), result
    return result


def get(quote):
    return request("GET", "/quotes/" + quote["id"])


def put(quote, data, expected=200):
    return request("PUT", "/quotes/" + quote["id"], data, expected)


def approve(quote, expected=200, **extra):
    return request("POST", "/quotes/" + quote["id"] + "/approve", {"name": "TESTE EDIÇÃO projeto", **extra}, expected)


def main():
    global TOKEN
    password = os.environ.get("PPCI_TEST_PASSWORD") or getpass.getpass("Local test password: ")
    TOKEN = request("POST", "/auth/login", {"email": "teste.local@example.com", "password": password})["access_token"]
    del password
    customer = sql("INSERT INTO customers(name) VALUES ('TESTE EDIÇÃO cliente') RETURNING id;")
    def create_company(label, kind):
        digits = f"{uuid.uuid4().int % 10**14:014d}"
        cnpj = f"{digits[:2]}.{digits[2:5]}.{digits[5:8]}/{digits[8:12]}-{digits[12:]}"
        return sql(f"INSERT INTO companies(name,cnpj,responsible,type) VALUES ('TESTE EDIÇÃO {label}','{cnpj}','TESTE EDIÇÃO','{kind}') RETURNING id;")

    company = create_company("interna", "internal")
    company2 = create_company("interna 2", "internal")
    supplier = create_company("fornecedor", "supplier")
    service = sql("SELECT id FROM services LIMIT 1;")
    print("Fixture customer:", customer, "companies:", company, company2, supplier, flush=True)

    def item(quantity=1, price=100, **extra):
        return {"service_id": service, "quantity": quantity, "unit_price": price, "description": "TESTE EDIÇÃO item", **extra}

    def create(label):
        quote = request("POST", "/quotes", {
            "customer_id": customer, "company_id": company,
            "valid_until": "2028-02-29", "notes": "TESTE EDIÇÃO " + label,
            "discount": 10, "items": [item()],
        }, 201)
        FIXTURES.append(quote["id"])
        print("Fixture quote:", label, quote["id"], flush=True)
        return quote

    quote = create("contrato")
    original = get(quote)
    changed = put(quote, {"notes": "TESTE EDIÇÃO alterado"})
    for field in ("customer_id", "company_id", "status", "discount", "valid_until", "items", "total_amount"):
        assert changed[field] == original[field], field
    changed = put(quote, {"notes": None, "valid_until": None, "discount": 0})
    assert changed["notes"] is None and changed["valid_until"] is None and changed["discount"] == 0
    changed = put(quote, {"valid_until": "2028-02-29", "company_id": company2, "status": "sent"})
    assert changed["status"] == "sent" and changed["company_id"] == company2
    assert changed["valid_until"].startswith("2028-02-29")
    assert put(quote, {"notes": "TESTE EDIÇÃO enviado"})["status"] == "sent"
    before = get(quote)
    invalid = [
        {"customer_id": str(uuid.uuid4())}, {"items": []}, {"items": None},
        {"valid_until": "2027-02-29"}, {"valid_until": "2028-02-30"},
        {"valid_until": "2028-02-29T00:00:00Z"}, {"valid_until": "29/02/2028"},
        {"discount": -1}, {"discount": 0.001}, {"discount": 100000000},
        {"company_id": supplier}, {"company_id": str(uuid.uuid4())}, {"company_id": None},
        {"status": "approved"}, {"notes": 1},
    ]
    for field, values in (("quantity", [0, -1, 1.0001, 10000000, 1e100]), ("unit_price", [0, -1, 1.001, 100000000, 1e100])):
        invalid.extend({"items": [item(**{("price" if field == "unit_price" else field): value})]} for value in values)
    for data in invalid:
        put(quote, data, 400)
        assert get(quote) == before, data
    request("PUT", "/quotes/" + quote["id"], b'{"discount": 1e999}', 400)
    request("PUT", "/quotes/" + quote["id"], b'{', 400)
    approve(quote, 400, name="")
    request("POST", "/quotes/" + quote["id"] + "/approve", b'{', 400)
    for method, suffix, body in (("PUT", "", {}), ("POST", "/approve", {"name": "TESTE EDIÇÃO"})):
        request(method, "/quotes/" + str(uuid.uuid4()) + suffix, body, 404)
        request(method, "/quotes/not-a-uuid" + suffix, body, 400)
    print("PASS partial/null/zero/date/precision/validation/status/errors", flush=True)

    # Failure AFTER header write, deletion and first replacement insertion.
    for data in (
        {"notes": "TESTE EDIÇÃO rollback FK", "items": [item(), item(service_id=str(uuid.uuid4()))]},
        {"notes": "TESTE EDIÇÃO overflow linha", "items": [item(2, 99999999.99)]},
        {"notes": "TESTE EDIÇÃO overflow soma", "items": [item(1, 60000000), item(1, 60000000)]},
        {"notes": "TESTE EDIÇÃO desconto", "discount": 101},
    ):
        put(quote, data, 400)
        assert get(quote) == before, data
    put(quote, {"discount": 50})
    before = get(quote)
    put(quote, {"items": [item(1, 49.99)]}, 400)  # omitted discount still applies
    assert get(quote) == before
    changed = put(quote, {"items": [item(0.125, 0.04), item(0.125, 0.04)], "discount": 0.02})
    assert changed["total_amount"] == 0.02 and len(changed["items"]) == 2
    assert all(line["total_price"] == 0.01 for line in changed["items"])
    put(quote, {"discount": 0.03}, 400)  # omitted items still apply
    put(quote, {"items": [item(0.001, 0.01)], "discount": 0})
    assert get(quote)["total_amount"] == 0  # positive values may round to a zero line
    assert put(quote, {"items": [item(9999999.999, 0.01)]})["total_amount"] == 100000
    assert put(quote, {"items": [item(1, 99999999.99)], "discount": 99999999.99})["discount"] == 99999999.99
    # Existing create behavior can leave a legacy invalid discount; omission must not bypass the check.
    put(quote, {"items": [item()], "discount": 0})
    sql(f"UPDATE quotes SET discount=101 WHERE id='{quote['id']}';")
    before = get(quote)
    put(quote, {"notes": "TESTE EDIÇÃO desconto legado"}, 400)
    assert get(quote) == before
    put(quote, {"items": [item()], "discount": 0})
    print("PASS effective discount/PostgreSQL per-line rounding/rollback FK+overflow+discount", flush=True)

    # Valid schema, failure inserting project AFTER approved status was written.
    rollback_quote = create("rollback aprovação")
    before = get(rollback_quote)
    approve(rollback_quote, 500, name="TESTE EDIÇÃO " + "x" * 256)
    assert get(rollback_quote) == before
    assert sql(f"SELECT count(*) FROM projects WHERE quote_id='{rollback_quote['id']}';") == "0"
    changed = put(rollback_quote, {"company_id": company2, "items": [item(1.125, 10.12)], "discount": 1})
    project = approve(rollback_quote)["project_id"]
    print("Fixture project:", project, flush=True)
    snapshot = json.loads(sql(f"SELECT row_to_json(p) FROM projects p WHERE id='{project}';"))
    assert snapshot["total_value"] == 10.39 and snapshot["company_id"] == company2 and snapshot["customer_id"] == customer
    project_items = json.loads(sql(f"SELECT json_agg(s) FROM project_services s WHERE project_id='{project}';"))
    assert len(project_items) == 1
    for field in ("service_id", "quantity", "unit_price", "description", "total_price"):
        assert project_items[0][field] == changed["items"][0][field], field
    before = get(rollback_quote)
    put(rollback_quote, {"notes": "TESTE EDIÇÃO bloqueado"}, 400)
    approve(rollback_quote, 400)
    assert get(rollback_quote) == before
    rejected = create("rejeitado")
    put(rejected, {"status": "rejected"})
    before = get(rejected)
    put(rejected, {"status": "draft"}, 400)
    approve(rejected, 400)
    assert get(rejected) == before
    print("PASS approval rollback/net snapshot/services/approved+rejected blocked", flush=True)

    def waiting():
        return int(sql("SELECT count(*) FROM pg_stat_activity WHERE wait_event_type='Lock' AND query LIKE '%SELECT status FROM quotes%FOR UPDATE%';"))

    def await_waiters(count):
        deadline = time.monotonic() + 45
        while time.monotonic() < deadline:
            if waiting() >= count:
                return
            time.sleep(0.1)
        raise AssertionError(f"Expected {count} independent repository DB lock waiters, got {waiting()}")

    def repository_request(operation, quote):
        action, body, expected = operation
        # Read the local container credential into memory; never log/persist it.
        environment = json.loads(subprocess.run(["docker", "inspect", DB], capture_output=True, text=True, check=True).stdout)[0]["Config"]["Env"]
        db_password = next(entry.split("=", 1)[1] for entry in environment if entry.startswith("POSTGRES_PASSWORD="))
        root = str(Path(__file__).resolve().parents[4])
        command = ["docker", "run", "--rm", "-i", "--network", "container:" + DB,
                   "-e", "DATABASE_URL",
                   "-v", root + ":/workspace:ro", "-w", "/workspace", "denoland/deno:alpine-2.2.5",
                   "deno", "run", "--no-lock", "--node-modules-dir=none", "--allow-env", "--allow-net",
                   "supabase/functions/api/tests/quote_write_process.ts"]
        environment = {**os.environ, "DATABASE_URL": "postgres://postgres:" + db_password + "@127.0.0.1:5432/postgres"}
        result = subprocess.run(command, input=json.dumps({"action": action, "id": quote["id"], "body": body}),
                                env=environment, capture_output=True, text=True, timeout=70)
        # Do not include command/env in assertion failures (credential is in env).
        assert result.returncode == 0, result.stderr
        response = json.loads(result.stdout)
        assert response["status"] == expected, response
        return response["data"]

    def ordered_race(label, first, second):
        race_quote = create(label)
        # This third, independent SQL process gates the requests without production hooks.
        blocker = subprocess.Popen(PSQL, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1)
        try:
            blocker.stdin.write(f"BEGIN; SELECT id FROM quotes WHERE id='{race_quote['id']}' FOR UPDATE;\n")
            blocker.stdin.flush()
            assert blocker.stdout.readline().strip() == race_quote["id"]
            with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
                a = pool.submit(repository_request, first, race_quote)
                await_waiters(1)
                b = pool.submit(repository_request, second, race_quote)
                try:
                    await_waiters(2)
                    print("PROVEN two independent waiting repository DB sessions:", label, flush=True)
                finally:
                    blocker.stdin.write("COMMIT;\n")
                    blocker.stdin.flush()
                result = a.result(), b.result()
            return race_quote, result
        finally:
            blocker.communicate(timeout=10)
            assert blocker.returncode == 0

    race_quote, (_, approved) = ordered_race(
        "edição vence", ("update", {"company_id": company2, "items": [item(2, 75)], "discount": 25}, 200),
        ("approve", {"name": "TESTE EDIÇÃO concorrência"}, 200))
    project = approved["project_id"]
    assert sql(f"SELECT total_value || ':' || company_id FROM projects WHERE id='{project}';") == "125.00:" + company2
    assert sql(f"SELECT quantity FROM project_services WHERE project_id='{project}';") == "2.000"
    race_quote, _ = ordered_race("aprovação vence", ("approve", {"name": "TESTE EDIÇÃO concorrência"}, 200),
                                 ("update", {"notes": "TESTE EDIÇÃO não salvar"}, 400))
    assert get(race_quote)["notes"] == "TESTE EDIÇÃO aprovação vence"
    race_quote, _ = ordered_race("dupla aprovação", ("approve", {"name": "TESTE EDIÇÃO concorrência"}, 200),
                                 ("approve", {"name": "TESTE EDIÇÃO concorrência"}, 400))
    assert sql(f"SELECT count(*) FROM projects WHERE quote_id='{race_quote['id']}';") == "1"
    print("PASS concurrency update-first/approve-first/double-approval", flush=True)
    print("ALL PASS; fixtures retained:", ", ".join(FIXTURES), flush=True)


if __name__ == "__main__":
    main()
