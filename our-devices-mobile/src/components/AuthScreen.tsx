import { Link, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { getApiBaseUrl } from "../api";
import { useSession } from "../session";

type AuthMode = "login" | "register";
type Form = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const initialForm: Form = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "words";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        secureTextEntry={secureTextEntry}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

export default function AuthScreen({ mode }: { mode: AuthMode }) {
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { restoreError, signIn, register } = useSession();
  const apiConfigured = Boolean(getApiBaseUrl());

  const updateForm = (key: keyof Form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async () => {
    setErrorMessage("");
    if (!apiConfigured) {
      setErrorMessage("Configura EXPO_PUBLIC_API_URL en our-devices-mobile/.env.");
      return;
    }
    if (!form.email.trim() || !form.password) {
      setErrorMessage("Completa el correo o usuario y la contraseña.");
      return;
    }
    if (mode === "register") {
      if (!form.firstName.trim() || !form.lastName.trim() || !form.username.trim()) {
        setErrorMessage("Completa todos los campos.");
        return;
      }
      if (form.password.length < 8 || form.password.length > 72) {
        setErrorMessage("La contraseña debe tener entre 8 y 72 caracteres.");
        return;
      }
      if (!/^[A-Za-z0-9._-]{3,30}$/.test(form.username.trim())) {
        setErrorMessage("El usuario debe tener 3-30 caracteres alfanuméricos, punto, guion o guion bajo.");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setErrorMessage("Las contraseñas no coinciden.");
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === "register") {
        await register({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
        });
      } else {
        await signIn(form.email.trim(), form.password);
      }
      router.replace("/dashboard");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudo completar la autenticación.",
      );
    } finally {
      setBusy(false);
    }
  };

  const heading = mode === "login" ? "Qué bueno verte" : "Empieza ahora";
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <ScrollView contentContainerStyle={styles.authScroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>OD</Text>
        </View>
        <Text style={styles.brandTitle}>OurDevices</Text>
        <Text style={styles.brandSubtitle}>
          Tus dispositivos, conectados y visibles desde cualquier lugar.
        </Text>

        <View style={styles.authCard}>
          <Text style={styles.formTitle}>{heading}</Text>
          <Text style={styles.formDescription}>
            {mode === "login"
              ? "Accede para consultar el estado de tus equipos."
              : "Crea tu cuenta y registra este teléfono."}
          </Text>

          {mode === "register" && (
            <>
              <Field
                autoCapitalize="words"
                label="Nombre"
                onChangeText={(value) => updateForm("firstName", value)}
                placeholder="Tu nombre"
                value={form.firstName}
              />
              <Field
                autoCapitalize="words"
                label="Apellido"
                onChangeText={(value) => updateForm("lastName", value)}
                placeholder="Tu apellido"
                value={form.lastName}
              />
              <Field
                label="Nombre de usuario"
                onChangeText={(value) => updateForm("username", value)}
                placeholder="usuario"
                value={form.username}
              />
            </>
          )}
          <Field
            keyboardType={mode === "login" ? "default" : "email-address"}
            label={mode === "login" ? "Correo o usuario" : "Correo electrónico"}
            onChangeText={(value) => updateForm("email", value)}
            placeholder={mode === "login" ? "correo@dominio.com o usuario" : "correo@dominio.com"}
            value={form.email}
          />
          <Field
            label="Contraseña"
            onChangeText={(value) => updateForm("password", value)}
            placeholder={mode === "register" ? "Mínimo 8 caracteres" : "Tu contraseña"}
            secureTextEntry
            value={form.password}
          />
          {mode === "register" && (
            <Field
              label="Confirmar contraseña"
              onChangeText={(value) => updateForm("confirmPassword", value)}
              placeholder="Repite la contraseña"
              secureTextEntry
              value={form.confirmPassword}
            />
          )}

          {!apiConfigured ? (
            <Text style={styles.warning}>
              Falta configurar la dirección de la API. Revisa las instrucciones del README.
            </Text>
          ) : null}
          {restoreError ? <Text style={styles.error}>{restoreError}</Text> : null}
          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void handleSubmit()}
            style={({ pressed }) => [styles.button, pressed && styles.pressed, busy && styles.disabled]}
          >
            {busy ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>
                {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </Text>
            )}
          </Pressable>
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>
            {mode === "login" ? "¿No tienes una cuenta?" : "¿Ya tienes cuenta?"}
          </Text>
          <Link href={mode === "login" ? "/register" : "/login"} style={styles.link}>
            {mode === "login" ? "Regístrate" : "Inicia sesión"}
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const colors = {
  background: "#080e1a",
  surface: "#111b2b",
  surfaceRaised: "#172438",
  border: "#26364d",
  text: "#f1f5f9",
  secondary: "#a7b5c8",
  muted: "#74839a",
  blue: "#60a5fa",
  white: "#ffffff",
  red: "#fca5a5",
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  authScroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 36,
  },
  brandMark: {
    width: 54,
    height: 54,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#2563eb",
  },
  brandMarkText: { color: colors.white, fontSize: 18, fontWeight: "900" },
  brandTitle: {
    marginTop: 16,
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
  },
  brandSubtitle: {
    maxWidth: 310,
    alignSelf: "center",
    marginTop: 7,
    marginBottom: 26,
    color: colors.secondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  authCard: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    backgroundColor: colors.surface,
  },
  formTitle: { marginTop: 2, color: colors.text, fontSize: 22, fontWeight: "700" },
  formDescription: {
    marginTop: 5,
    marginBottom: 14,
    color: colors.secondary,
    fontSize: 13,
    lineHeight: 19,
  },
  field: { marginTop: 12 },
  fieldLabel: { marginBottom: 7, color: "#d3dbea", fontSize: 13, fontWeight: "600" },
  input: {
    minHeight: 48,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: 14,
  },
  button: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    paddingHorizontal: 18,
    borderRadius: 11,
    backgroundColor: "#2563eb",
  },
  buttonText: { color: colors.white, fontSize: 14, fontWeight: "700" },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.65 },
  error: {
    marginTop: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    borderRadius: 10,
    backgroundColor: "#3b1018",
    color: colors.red,
    fontSize: 13,
    lineHeight: 19,
  },
  warning: { marginTop: 14, color: "#fbbf24", fontSize: 12, lineHeight: 18 },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    marginTop: 20,
  },
  switchText: { color: colors.secondary, fontSize: 13 },
  link: { color: colors.blue, fontSize: 13, fontWeight: "700" },
});
