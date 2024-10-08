import * as SecureStore from "expo-secure-store";
import { StyleSheet, View } from "react-native";
import { useEffect, useState } from "react";
import { useFonts } from "expo-font";
import { Amplify } from "aws-amplify";
import BeerCount from "./screens/count/BeerCount";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "./screens/auth/Login";
import React from "react";
import Setup from "./screens/auth/Setup";
import amplifyconfig from "./amplifyconfiguration.json";
import { generateClient } from "aws-amplify/api";
import { getUser } from "./src/graphql/queries";
import CameraPage from "./screens/count/CameraPage";

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

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userCheck, setUserCheck] = useState<boolean>(false);
  const client = generateClient();

  const [loaded, error] = useFonts({
    "RubikMonoOne-Regular": require("./assets/fonts/RubikMonoOne-Regular.ttf"),
  });

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
    <View style={styles.container}>
      {user ? (
        user.initialCount !== null && user.username !== null ? (
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="BeerCount"
              screenOptions={{ headerShown: false }}
            >
              <Stack.Screen
                name="BeerCount"
                component={BeerCount}
                initialParams={{ user: user }}
              />
              <Stack.Screen name="CameraPage" component={CameraPage} />
            </Stack.Navigator>
          </NavigationContainer>
        ) : (
          <Setup setUser={updateUser} user={user} />
        )
      ) : (
        <Login setUser={setUser} />
      )}
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
