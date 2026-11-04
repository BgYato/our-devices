import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSession } from "../session";

export default function IndexRoute() {
  const { loading, user } = useSession();
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#60a5fa" size="large" />
      </View>
    );
  }
  return <Redirect href={user ? "/dashboard" : "/login"} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#080e1a",
  },
});
