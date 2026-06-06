CREATE TABLE IF NOT EXISTS users (
  id             SERIAL PRIMARY KEY,
  nome           VARCHAR(150) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  password       VARCHAR(255) NOT NULL,
  role           VARCHAR(20) NOT NULL DEFAULT 'eleitor',
  otp_code       VARCHAR(6),
  otp_expires_at TIMESTAMP,
  reset_token    VARCHAR(64),
  reset_expires  TIMESTAMP,
  foto           TEXT,
  verified       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grupos (
  id         SERIAL PRIMARY KEY,
  nome       VARCHAR(100) NOT NULL UNIQUE,
  descricao  TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_grupos (
  user_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  grupo_id INT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, grupo_id)
);

CREATE TABLE IF NOT EXISTS eleicoes (
  id          SERIAL PRIMARY KEY,
  titulo      VARCHAR(200) NOT NULL,
  descricao   TEXT,
  inicio      TIMESTAMP NOT NULL,
  fim         TIMESTAMP NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'rascunho',
  multi_cargo BOOLEAN NOT NULL DEFAULT FALSE,
  criado_por  INT NOT NULL REFERENCES users(id),
  grupo_id    INT REFERENCES grupos(id),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cargos (
  id         SERIAL PRIMARY KEY,
  eleicao_id INT NOT NULL REFERENCES eleicoes(id) ON DELETE CASCADE,
  nome       VARCHAR(100) NOT NULL,
  descricao  TEXT,
  ordem      INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidatos (
  id         SERIAL PRIMARY KEY,
  eleicao_id INT NOT NULL REFERENCES eleicoes(id) ON DELETE CASCADE,
  cargo_id   INT REFERENCES cargos(id) ON DELETE CASCADE,
  nome       VARCHAR(150) NOT NULL,
  descricao  TEXT,
  foto_url   VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS votos (
  id           SERIAL PRIMARY KEY,
  eleicao_id   INT NOT NULL,
  eleitor_id   INT NOT NULL,
  cargo_id     INT,
  candidato_id INT,
  tipo_voto    VARCHAR(20) NOT NULL DEFAULT 'candidato',
  token_unico  VARCHAR(64) NOT NULL UNIQUE,
  hash_voto    VARCHAR(64),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (eleicao_id)   REFERENCES eleicoes(id)   ON DELETE CASCADE,
  FOREIGN KEY (eleitor_id)   REFERENCES users(id),
  FOREIGN KEY (cargo_id)     REFERENCES cargos(id),
  FOREIGN KEY (candidato_id) REFERENCES candidatos(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS votos_unique_voto ON votos (eleicao_id, eleitor_id, COALESCE(cargo_id, 0));

-- Migrations for tables created before new columns were added
ALTER TABLE eleicoes ADD COLUMN IF NOT EXISTS multi_cargo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE eleicoes ADD COLUMN IF NOT EXISTS grupo_id INT;
ALTER TABLE eleicoes ADD FOREIGN KEY (grupo_id) REFERENCES grupos(id);
ALTER TABLE users    ADD COLUMN IF NOT EXISTS foto TEXT;

INSERT INTO users (nome, email, password, role, verified)
VALUES ('Administrador', 'admin@votacao.mz',
        '$2a$10$ICSTBIBpTdNz7B1IttNInebkqKfxnO3CRY2KLUjkVkqGp3Z1Y57UK', 'admin', TRUE)
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = 'admin', verified = TRUE;

INSERT INTO grupos (nome, descricao) VALUES
  ('Direcção Executiva', 'Presidente, vice-presidentes e directores'),
  ('Assembleia Geral', 'Deputados e representantes do povo'),
  ('Conselho Fiscal', 'Órgão de fiscalização e auditoria'),
  ('Comissão Eleitoral', 'Organização e supervisão do processo eleitoral'),
  ('Membros Efectivos', 'Membros com direito a voto'),
  ('Delegados', 'Representantes eleitos de cada região'),
  ('Funcionários', 'Colaboradores da instituição'),
  ('Cidadãos', 'Eleitorado geral e público'),
  ('Observadores', 'Observadores nacionais e internacionais'),
  ('Convidados', 'Convidados sem direito a voto')
ON CONFLICT (nome) DO NOTHING;
