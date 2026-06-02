// src/views/admin/module/auth/components/LoginForm.jsx

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom"; // 👈 importar navigate
import { Spinner } from "@/components/ui/spinner";
import type { LoginBody } from "@/views/admin/module/auth/types/auth.types";
import { useForm } from "@/hooks/useForm";
import { useAuthStore } from "@/views/admin/module/auth/";
import { toast, Toaster } from "react-hot-toast";
import type { FormEvent } from "react";

// import { useNavigate } from "react-router-dom";

const initialForm: LoginBody = {
  username: "",
  password: "",
};

export const LoginPage = () => {
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const { username, password, onInputChange } = useForm<LoginBody>(initialForm);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      return toast.error("Por favor completa usuario y contraseña");
    }

    const { success, message } = await login(username, password);

    if (!success) {
      return toast.error(message || "Error al iniciar sesión");
    }

    navigate("/admin/account");
  };

  return (
    <section className="flex justify-center items-center h-screen">
      <div className="w-full max-w-sm mx-auto p-6 bg-white rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold text-center mb-4">
          Iniciar sesión
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">Usuario</Label>
            <Input
              id="username"
              name="username"
              placeholder="Ingresa tu usuario"
              className="mt-2"
              value={username}
              onChange={onInputChange}
              autoFocus
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              className="mt-2"
              placeholder="******"
              value={password}
              onChange={onInputChange}
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full cursor-pointer">
            {loading ? <Spinner className="size-6" /> : "Ingresar"}
          </Button>
        </form>
      </div>
      <Toaster position="top-right" reverseOrder={false} />
    </section>
  );
};
