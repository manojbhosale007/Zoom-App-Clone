import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";

export const AuthContext = createContext(null);

const client = axios.create({
  baseURL: `${server}/api/v1/users`,
});

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [userData, setUserData] = useState(() => ({
    token: localStorage.getItem("token") || null,
  }));

  const handleRegister = async (name, username, password) => {
    const response = await client.post("/register", {
      name,
      username,
      password,
    });

    if (response.status === httpStatus.CREATED) {
      return response.data.message;
    }

    throw new Error(response.data?.message || "Registration failed");
  };

  const handleLogin = async (username, password) => {
    const response = await client.post("/login", {
      username,
      password,
    });

    if (response.status === httpStatus.OK) {
      const token = response.data.token;

      if (!token) {
        throw new Error("Login succeeded, but no token was returned");
      }

      localStorage.setItem("token", token);

      setUserData((previous) => ({
        ...previous,
        ...response.data,
        token,
      }));

      navigate("/home");

      return response.data;
    }

    throw new Error(response.data?.message || "Login failed");
  };

  const getHistoryOfUser = async () => {
    const response = await client.get("/get_all_activity", {
      params: {
        token: localStorage.getItem("token"),
      },
    });

    return response.data;
  };

  const addToUserHistory = async (meetingCode) => {
    const response = await client.post("/add_to_activity", {
      token: localStorage.getItem("token"),
      meeting_code: meetingCode,
    });

    return response.data;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUserData({ token: null });
    navigate("/auth");
  };

  const data = {
    userData,
    setUserData,
    addToUserHistory,
    getHistoryOfUser,
    handleRegister,
    handleLogin,
    handleLogout,
  };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
