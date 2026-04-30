import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL ||
  "https://fsad-sdp-backend-needbridge.up.railway.app";

const API = axios.create({
  baseURL,
});

export default API;