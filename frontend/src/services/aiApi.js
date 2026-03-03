import axios from "axios";

const aiApi = axios.create({
  baseURL: "http://localhost/api", // Gateway AI service

  headers: {
    "Content-Type": "application/json",
  },
});

export const askAI = async (question) => {
  const res = await aiApi.post("/ai/chat", { question });
  return res.data;
};

export const checkGrammar = async (content) => {
  const res = await aiApi.post("/ai/grammar-check", { content });
  return res.data;
};

export default aiApi;
