import axios from "axios";

const api = axios.create({
  baseURL: "https://elearning.mssplonline.in/api/v1",
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;