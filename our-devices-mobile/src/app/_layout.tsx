import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SessionProvider } from "../session";

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#080e1a",
    card: "#080e1a",
    text: "#f1f5f9",
    border: "#26364d",
    primary: "#60a5fa",
  },
};

export default function RootLayout() {
  return (
    <SessionProvider>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#080e1a" } }} />
      </ThemeProvider>
    </SessionProvider>
  );
}
