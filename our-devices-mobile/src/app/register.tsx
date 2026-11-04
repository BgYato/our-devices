import { Redirect } from "expo-router";
import { useSession } from "../session";
import AuthScreen from "../components/AuthScreen";

export default function RegisterRoute() {
  const { user, loading } = useSession();
  if (!loading && user) return <Redirect href="/dashboard" />;
  return <AuthScreen mode="register" />;
}
