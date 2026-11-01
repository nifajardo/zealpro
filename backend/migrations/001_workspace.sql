CREATE TABLE zealpro.workspace_meta (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0),
  data_version integer NOT NULL DEFAULT 2 CHECK (data_version = 2),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO zealpro.workspace_meta (singleton) VALUES (true);

CREATE TABLE zealpro.materials (
  id text PRIMARY KEY, position integer NOT NULL, data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object' AND data->>'id' = id),
  name text GENERATED ALWAYS AS (data->>'name') STORED NOT NULL,
  unit text GENERATED ALWAYS AS (data->>'unit') STORED NOT NULL,
  stock numeric GENERATED ALWAYS AS ((data->>'stock')::numeric) STORED NOT NULL CHECK (stock >= 0),
  unit_cost numeric GENERATED ALWAYS AS ((data->>'cost')::numeric) STORED NOT NULL CHECK (unit_cost >= 0)
);
CREATE TABLE zealpro.services (
  id text PRIMARY KEY, position integer NOT NULL, data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object' AND data->>'id' = id),
  name text GENERATED ALWAYS AS (data->>'name') STORED NOT NULL,
  charge numeric GENERATED ALWAYS AS ((data->>'price')::numeric) STORED NOT NULL CHECK (charge >= 0)
);
CREATE TABLE zealpro.clients (
  id text PRIMARY KEY, position integer NOT NULL, data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object' AND data->>'id' = id),
  name text GENERATED ALWAYS AS (data->>'name') STORED NOT NULL,
  branch text GENERATED ALWAYS AS (data->>'branch') STORED NOT NULL
);
CREATE TABLE zealpro.visits (
  id text PRIMARY KEY, position integer NOT NULL, data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object' AND data->>'id' = id),
  client_id text GENERATED ALWAYS AS (data->>'clientId') STORED NOT NULL REFERENCES zealpro.clients(id),
  service_id text GENERATED ALWAYS AS (data->>'serviceId') STORED NOT NULL REFERENCES zealpro.services(id),
  service_date text GENERATED ALWAYS AS (data->>'date') STORED NOT NULL,
  status text GENERATED ALWAYS AS (data->>'status') STORED NOT NULL CHECK (status IN ('Scheduled', 'In progress', 'Completed')),
  charge numeric GENERATED ALWAYS AS ((data->>'rate')::numeric) STORED NOT NULL CHECK (charge >= 0)
);
CREATE INDEX visits_by_date ON zealpro.visits(service_date, status);
CREATE INDEX visits_by_client ON zealpro.visits(client_id, service_date);
CREATE TABLE zealpro.reports (
  id text PRIMARY KEY, position integer NOT NULL, data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object' AND data->>'id' = id),
  visit_id text GENERATED ALWAYS AS (data->>'visitId') STORED NOT NULL UNIQUE REFERENCES zealpro.visits(id),
  client_id text GENERATED ALWAYS AS (data->>'clientId') STORED NOT NULL REFERENCES zealpro.clients(id),
  actual_charge numeric GENERATED ALWAYS AS ((data->>'actualRevenue')::numeric) STORED NOT NULL CHECK (actual_charge >= 0),
  expense numeric GENERATED ALWAYS AS ((data->>'expense')::numeric) STORED NOT NULL CHECK (expense >= 0)
);
CREATE TABLE zealpro.invoices (
  id text PRIMARY KEY, position integer NOT NULL, data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object' AND data->>'id' = id),
  client_id text GENERATED ALWAYS AS (data->>'clientId') STORED NOT NULL REFERENCES zealpro.clients(id),
  visit_id text GENERATED ALWAYS AS (data->>'visitId') STORED UNIQUE REFERENCES zealpro.visits(id),
  due_date text GENERATED ALWAYS AS (data->>'due') STORED NOT NULL,
  amount numeric GENERATED ALWAYS AS ((data->>'amount')::numeric) STORED NOT NULL CHECK (amount >= 0),
  paid numeric GENERATED ALWAYS AS ((data->>'paid')::numeric) STORED NOT NULL CHECK (paid >= 0 AND paid <= amount)
);
CREATE INDEX invoices_due ON zealpro.invoices(due_date) WHERE paid < amount;
CREATE TABLE zealpro.assessments (
  id text PRIMARY KEY, position integer NOT NULL, data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object' AND data->>'id' = id),
  client_id text GENERATED ALWAYS AS (NULLIF(data->>'clientId', '')) STORED REFERENCES zealpro.clients(id),
  material_id text GENERATED ALWAYS AS (data->>'materialId') STORED NOT NULL REFERENCES zealpro.materials(id)
);
CREATE TABLE zealpro.observations (
  position integer PRIMARY KEY, data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  client_id text GENERATED ALWAYS AS (data->>'clientId') STORED NOT NULL REFERENCES zealpro.clients(id)
);
CREATE TABLE zealpro.service_products (
  owner_id text NOT NULL REFERENCES zealpro.services(id), position integer NOT NULL, data jsonb NOT NULL,
  product_id text GENERATED ALWAYS AS (data->>'productId') STORED NOT NULL REFERENCES zealpro.materials(id),
  quantity numeric GENERATED ALWAYS AS ((data->>'quantity')::numeric) STORED NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (owner_id, product_id), UNIQUE (owner_id, position)
);
CREATE TABLE zealpro.visit_products (
  owner_id text NOT NULL REFERENCES zealpro.visits(id), position integer NOT NULL, data jsonb NOT NULL,
  product_id text GENERATED ALWAYS AS (data->>'productId') STORED NOT NULL REFERENCES zealpro.materials(id),
  quantity numeric GENERATED ALWAYS AS ((data->>'quantity')::numeric) STORED NOT NULL CHECK (quantity > 0),
  unit_cost numeric GENERATED ALWAYS AS ((data->>'unitCost')::numeric) STORED NOT NULL CHECK (unit_cost >= 0),
  PRIMARY KEY (owner_id, product_id), UNIQUE (owner_id, position)
);
CREATE TABLE zealpro.report_products (
  owner_id text NOT NULL REFERENCES zealpro.reports(id), position integer NOT NULL, data jsonb NOT NULL,
  product_id text GENERATED ALWAYS AS (data->>'productId') STORED NOT NULL REFERENCES zealpro.materials(id),
  quantity numeric GENERATED ALWAYS AS ((data->>'quantity')::numeric) STORED NOT NULL CHECK (quantity > 0),
  unit_cost numeric GENERATED ALWAYS AS ((data->>'unitCost')::numeric) STORED NOT NULL CHECK (unit_cost >= 0),
  PRIMARY KEY (owner_id, product_id), UNIQUE (owner_id, position)
);
CREATE TABLE zealpro.payments (
  owner_id text NOT NULL REFERENCES zealpro.invoices(id), position integer NOT NULL, data jsonb NOT NULL,
  amount numeric GENERATED ALWAYS AS ((data->>'amount')::numeric) STORED NOT NULL CHECK (amount > 0),
  PRIMARY KEY (owner_id, position)
);
CREATE TABLE zealpro.command_receipts (
  request_id text PRIMARY KEY, request_hash text NOT NULL, action text NOT NULL,
  revision integer NOT NULL UNIQUE, result jsonb NOT NULL, committed_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE zealpro.workspace_backups (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, revision integer NOT NULL,
  state jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON SCHEMA zealpro FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA zealpro FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA zealpro REVOKE ALL ON TABLES FROM PUBLIC;
