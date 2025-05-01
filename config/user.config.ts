import { api } from "./axios.config";

export const registerUser = async (data: any) => {
  try {
    const response = await api.post("/register", data);

    return response.data;
  } catch (error: any) {
    return error.response.data;
  }
};
