

```bash
# Inicia o MySQL
docker-compose up -d

# Aguarda ~10 segundos e arranca o backend
cd backend
cp .env.example .env   # edita o ficheiro .env
npm install
npm run dev
```

### Opção B — MySQL via XAMPP

1. Abre o XAMPP e inicia o MySQL
2. Abre o phpMyAdmin e executa `backend/src/config/schema.sql`
3. No `.env` do backend, deixa `DB_PASS=` vazio

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Frontend (em terminal separado)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```



## Funcionalidades

### Eleitor (utilizador comum)
- Registo com verificação OTP por email
- Login com JWT
- Ver eleições activas
- Votar uma vez por eleição (voto confidencial com token único)
- Ver resultados de eleições encerradas

### Administrador
- Tudo do eleitor +
- Criar, activar e encerrar eleições
- Adicionar candidatos
- Ver resultados em tempo real (mesmo de eleições activas)
- Gerir utilizadores e promover/remover admins




