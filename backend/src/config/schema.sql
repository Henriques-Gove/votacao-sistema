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
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (eleicao_id)   REFERENCES eleicoes(id)   ON DELETE CASCADE,
  FOREIGN KEY (eleitor_id)   REFERENCES users(id),
  FOREIGN KEY (cargo_id)     REFERENCES cargos(id),
  FOREIGN KEY (candidato_id) REFERENCES candidatos(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS votos_unique_voto ON votos (eleicao_id, eleitor_id, COALESCE(cargo_id, 0));

INSERT INTO users (nome, email, password, role, verified)
VALUES ('Administrador', 'admin@votacao.mz',
        '$2a$10$ICSTBIBpTdNz7B1IttNInebkqKfxnO3CRY2KLUjkVkqGp3Z1Y57UK', 'admin', TRUE)
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = 'admin', verified = TRUE;

INSERT INTO grupos (nome, descricao) VALUES
  ('Direcção da Escola', 'Director, subdirectores e chefes de departamento'),
  ('Professores', 'Corpo docente da escola'),
  ('Funcionários', 'Pessoal administrativo e auxiliar'),
  ('Associação de Pais', 'Representantes dos encarregados de educação'),
  ('Conselho Escolar', 'Membros do conselho escolar'),
  ('Delegados de Turma', 'Delegados e subdelegados de todas as turmas'),
  ('Alunos 1º Ciclo', 'Alunos do 1º ao 4º ano'),
  ('Alunos 2º Ciclo', 'Alunos do 5º ao 6º ano'),
  ('Alunos 3º Ciclo', 'Alunos do 7º ao 9º ano'),
  ('Alunos Secundário', 'Alunos do 10º ao 12º ano')
ON CONFLICT (nome) DO NOTHING;
