export const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL ||
    "https://trustfound-backend.onrender.com"
).replace(/\/+$/, "");

export const API = `${API_BASE_URL}/api`;