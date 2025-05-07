import express from 'express';
import cors from 'cors';
// Usando require para importações CommonJS
const gastosRoutes = require('./routes/gastosRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const recebimentosRoutes = require('./routes/recebimentosRoutes');
const contasFixasRoutes = require('./routes/contasFixasRoutes');
const economiaRoutes = require('./routes/economiaRoutes');
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());
app.use('/gastos', gastosRoutes);
app.use(chatbotRoutes);
app.use('/usuarios', usuarioRoutes);
app.use('/api/recebimentos', recebimentosRoutes);
app.use('/api/contas-fixas', contasFixasRoutes);
app.use('/api/economia', economiaRoutes);

// Modificar esta linha para ouvir em todos os IPs, não apenas localhost
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://0.0.0.0:${port}`);
});