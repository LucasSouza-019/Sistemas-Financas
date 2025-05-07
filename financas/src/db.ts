import mysql from 'mysql2/promise';

// Cria um pool de conexões com o banco de dados
const pool = mysql.createPool({
  host: 'localhost',        // Host do banco de dados
  user: 'root',             // Usuário do MySQL (padrão do XAMPP)
  password: '',             // Senha do MySQL (geralmente vazia no XAMPP)
  database: 'financas',     // Nome do banco de dados que você criou
  waitForConnections: true,
  connectionLimit: 10,      // Número máximo de conexões no pool
  queueLimit: 0
});

// CommonJS export
export default pool;