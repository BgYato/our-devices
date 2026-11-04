import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../service/authService";
import LoadingButton from "../components/ui/LoadingButton";
import { useToast } from "../context/ToastContext";

function Register() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const { addToast } = useToast();

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (form.password !== form.confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      addToast("Cuenta creada. Ya puedes iniciar sesión.", "success");
      navigate("/login", { replace: true });
    } catch (error) {
      setErrorMessage(
        error.description || error.message || "No se pudo crear la cuenta."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 px-4 py-8">
      <section className="w-full max-w-lg rounded-2xl border border-gray-700 bg-gray-800/90 p-8 shadow-2xl">
        <h1 className="mb-2 text-center text-3xl font-bold text-blue-400">
          Crear cuenta
        </h1>
        <p className="mb-6 text-center text-sm text-gray-300">
          Regístrate para empezar a gestionar tus dispositivos.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-300">
              Nombre
              <input
                className={inputClass}
                name="firstName"
                autoComplete="given-name"
                maxLength={80}
                value={form.firstName}
                onChange={updateField}
                required
              />
            </label>
            <label className="text-sm font-medium text-gray-300">
              Apellido
              <input
                className={inputClass}
                name="lastName"
                autoComplete="family-name"
                maxLength={80}
                value={form.lastName}
                onChange={updateField}
                required
              />
            </label>
          </div>
          <label className="block text-sm font-medium text-gray-300">
            Nombre de usuario
            <input
              className={inputClass}
              name="username"
              autoComplete="username"
              minLength={3}
              maxLength={30}
              pattern="[A-Za-z0-9._-]+"
              title="Usa letras, números, punto, guion o guion bajo."
              value={form.username}
              onChange={updateField}
              required
            />
          </label>
          <label className="block text-sm font-medium text-gray-300">
            Correo electrónico
            <input
              className={inputClass}
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              value={form.email}
              onChange={updateField}
              required
            />
          </label>
          <label className="block text-sm font-medium text-gray-300">
            Contraseña
            <input
              className={inputClass}
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              value={form.password}
              onChange={updateField}
              required
            />
          </label>
          <label className="block text-sm font-medium text-gray-300">
            Confirmar contraseña
            <input
              className={inputClass}
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              value={form.confirmPassword}
              onChange={updateField}
              required
            />
          </label>

          {errorMessage && (
            <p role="alert" className="rounded-lg bg-red-900/50 px-3 py-2 text-sm text-red-200">
              {errorMessage}
            </p>
          )}

          <LoadingButton type="submit" isLoading={loading}>
            Crear cuenta
          </LoadingButton>
        </form>

        <p className="mt-6 text-center text-sm text-gray-300">
          ¿Ya tienes cuenta?{" "}
          <Link className="font-semibold text-blue-300 hover:text-blue-200" to="/login">
            Inicia sesión
          </Link>
        </p>
      </section>
    </main>
  );
}

export default Register;
