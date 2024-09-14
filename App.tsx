import { SafeAreaView, StyleSheet, View, Text } from "react-native";
import Login from "./screens/auth/Login";
import { Amplify } from "aws-amplify";
import { Hub } from "@aws-amplify/core";
import amplifyconfig from "./amplifyconfiguration.json";
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import Setup from "./screens/auth/Setup";
import { generateClient } from "aws-amplify/api";
import { getUser } from "./src/graphql/queries";

Amplify.configure(amplifyconfig);

const UserStorageKey = "USER_ID";

async function save(key: string, value: string) {
  await SecureStore.setItemAsync(key, value);
}

async function getValueFor(key: string): Promise<string | null> {
  let result = await SecureStore.getItemAsync(key);

  if (!result) {
    console.log("No stored user");
  }

  return result;
}

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userCheck, setUserCheck] = useState<boolean>(false);
  const client = generateClient();

  useEffect(() => {
    console.log("Refreshed on user");
    if (user) {
      save(UserStorageKey, user.id);
    }
  }, [user]);

  useEffect(() => {
    if (userCheck) return;
    getValueFor(UserStorageKey)
      .then((result) => {
        if (result) {
          try {
            client
              .graphql({
                query: getUser,
                variables: {
                  id: result,
                },
                authToken: "da2-77k6yg6ybng6lnn4tygjwdclwy",
              })
              .then((existingUser) => {
                if (existingUser.data.getUser) {
                  setUser(existingUser.data.getUser as User);
                  console.log("User found");
                  return;
                }
              });
          } catch (e: any) {
            console.log("Initial user not found");
          }
        }
      })
      .finally(() => setUserCheck(true));
  }, []);

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    console.log("User updated");
  };

  return (
    <SafeAreaView style={styles.container}>
      {user ? (
        user.initialCount !== null && user.username !== null ? (
          <View>
            <Text>Logged in as {user.id}</Text>
          </View>
        ) : (
          <Setup setUser={updateUser} user={user} />
        )
      ) : (
        <Login setUser={setUser} />
      )}
    </SafeAreaView>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
