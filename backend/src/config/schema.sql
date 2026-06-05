-- schema.sql
-- Executar no phpMyAdmin ou MySQL CLI

CREATE DATABASE IF NOT EXISTS votacao CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE votacao;

-- Utilizadores
CREATE TABLE IF NOT EXISTS users (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  nome           VARCHAR(150) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  password       VARCHAR(255) NOT NULL,
  role           ENUM('eleitor','admin') NOT NULL DEFAULT 'eleitor',
  otp_code       VARCHAR(6),
  otp_expires_at DATETIME,
  verified       TINYINT(1) NOT NULL DEFAULT 0,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Eleições
CREATE TABLE IF NOT EXISTS eleicoes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  titulo      VARCHAR(200) NOT NULL,
  descricao   TEXT,
  inicio      DATETIME NOT NULL,
  fim         DATETIME NOT NULL,
  status      ENUM('rascunho','activa','encerrada') NOT NULL DEFAULT 'rascunho',
  criado_por  INT NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (criado_por) REFERENCES users(id)
);

-- Candidatos
CREATE TABLE IF NOT EXISTS candidatos (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  eleicao_id INT NOT NULL,
  nome       VARCHAR(150) NOT NULL,
  descricao  TEXT,
  foto_url   VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (eleicao_id) REFERENCES eleicoes(id) ON DELETE CASCADE
);

-- Votos (cada eleitor só pode votar uma vez por eleição)
CREATE TABLE IF NOT EXISTS votos (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  eleicao_id   INT NOT NULL,
  eleitor_id   INT NOT NULL,
  candidato_id INT NOT NULL,
  token_unico  VARCHAR(64) NOT NULL UNIQUE,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unico_voto (eleicao_id, eleitor_id),
  FOREIGN KEY (eleicao_id)   REFERENCES eleicoes(id)   ON DELETE CASCADE,
  FOREIGN KEY (eleitor_id)   REFERENCES users(id),
  FOREIGN KEY (candidato_id) REFERENCES candidatos(id)
);

-- Admin padrão (password: Admin@123)
INSERT IGNORE INTO users (nome, email, password, role, verified)
VALUES ('Administrador', 'admin@votacao.mz',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'admin', 1);
