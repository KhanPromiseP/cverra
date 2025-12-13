// src/api/axios.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api'; // backend URL

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send cookies
});

export default api;
