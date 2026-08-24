import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true
});

let onUnauthorised = () => {};
export const setUnauthorisedHandler = (fn) => {
  onUnauthorised = fn;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes("/auth/me")
    ) {
      onUnauthorised();
    }

    return Promise.reject(error);
  }
);
export default api;
