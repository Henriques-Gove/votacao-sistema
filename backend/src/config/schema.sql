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
  criado_por  INT NOT NULL REFERENCES users(id),
  grupo_id    INT REFERENCES grupos(id),
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
  candidato_id INT,
  tipo_voto    VARCHAR(20) NOT NULL DEFAULT 'candidato',
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

INSERT INTO grupos (nome, descricao) VALUES
  ('Turma A', '1º Ano - Turma A'),
  ('Turma B', '1º Ano - Turma B'),
  ('Turma C', '2º Ano - Turma C'),
  ('Turma D', '2º Ano - Turma D'),
  ('Turma E', '3º Ano - Turma E'),
  ('Turma F', '3º Ano - Turma F'),
  ('Turma G', '4º Ano - Turma G'),
  ('Turma H', '4º Ano - Turma H'),
  ('Professores', 'Corpo docente'),
  ('Funcionários', 'Pessoal administrativo')
ON CONFLICT (nome) DO NOTHING;
