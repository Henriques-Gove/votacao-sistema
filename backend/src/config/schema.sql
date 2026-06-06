CREATE TABLE IF NOT EXISTS users (
  id             SERIAL PRIMARY KEY,
  nome           VARCHAR(150) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  password       VARCHAR(255) NOT NULL,
  role           VARCHAR(20) NOT NULL DEFAULT 'eleitor',
  otp_code       VARCHAR(6),
  otp_expires_at TIMESTAMP,
  verified       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS eleicoes (
  id          SERIAL PRIMARY KEY,
  titulo      VARCHAR(200) NOT NULL,
  descricao   TEXT,
  inicio      TIMESTAMP NOT NULL,
  fim         TIMESTAMP NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'rascunho',
  criado_por  INT NOT NULL REFERENCES users(id),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidatos (
  id         SERIAL PRIMARY KEY,
  eleicao_id INT NOT NULL REFERENCES eleicoes(id) ON DELETE CASCADE,
  nome       VARCHAR(150) NOT NULL,
  descricao  TEXT,
  foto_url   VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS votos (
  id           SERIAL PRIMARY KEY,
  eleicao_id   INT NOT NULL,
  eleitor_id   INT NOT NULL,
  candidato_id INT NOT NULL,
  token_unico  VARCHAR(64) NOT NULL UNIQUE,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (eleicao_id, eleitor_id),
  FOREIGN KEY (eleicao_id)   REFERENCES eleicoes(id)   ON DELETE CASCADE,
  FOREIGN KEY (eleitor_id)   REFERENCES users(id),
  FOREIGN KEY (candidato_id) REFERENCES candidatos(id)
);

INSERT INTO users (nome, email, password, role, verified)
VALUES ('Administrador', 'admin@votacao.mz',
        '$2a$10$ICSTBIBpTdNz7B1IttNInebkqKfxnO3CRY2KLUjkVkqGp3Z1Y57UK', 'admin', TRUE)
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = 'admin', verified = TRUE;
