import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.0.41:3000', // Atualizado com seu IP local
});

// O restante do código permanece igual
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log("Token no localStorage:", token ? token.substring(0, 20) + "..." : "Não encontrado");
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para logar respostas
api.interceptors.response.use(
  (response) => {
    console.log("Resposta recebida de:", response.config.url);
    console.log("Status:", response.status);
    console.log("Dados:", response.data);
    return response;
  },
  (error) => {
    console.error("Erro na requisição:", error.config?.url);
    console.error("Status:", error.response?.status);
    console.error("Mensagem:", error.response?.data);
    return Promise.reject(error);
  }
);

export default api;