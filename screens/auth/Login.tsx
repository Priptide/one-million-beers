import * as AppleAuthentication from "expo-apple-authentication";
import { generateClient } from "aws-amplify/api";
import { View, Text, StyleSheet } from "react-native";
import { createUser } from "../../src/graphql/mutations";
import { getUser } from "../../src/graphql/queries";
import React from "react";
import BeerCounter from "../count/BeerCounter";

export default function Login(props: { setUser: (user: User) => void }) {
  const client = generateClient();

  return (
    <View style={styles.container}>
      <View style={styles.body}>
        <View
          style={{
            height: "40%",
            width: "80%",
          }}
        >
          <Text style={styles.title}>
            We need your help! Sign up to help us drink 1 million beers.
          </Text>
        </View>
        <View
          style={{
            height: "20%",
            width: "100%",
          }}
        >
          <BeerCounter />
        </View>
      </View>
      <View style={styles.footer}>
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={5}
          style={styles.button}
          onPress={async () => {
            try {
              const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                  AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                  AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
              });

              console.log(credential);

              const url = "public/users/" + credential.user + ".json";

              // check if there is a user already registered
              const currentUser = await client.graphql({
                query: getUser,
                variables: {
                  id: credential.user,
                },
                authToken: "da2-77k6yg6ybng6lnn4tygjwdclwy",
              });

              if (currentUser.data.getUser) {
                props.setUser(currentUser.data.getUser as User);
                console.log("User found");
                return;
              }

              const user: User = {
                id: credential.user,
                username: null,
                initialCount: null,
                currentCount: 0,
              };

              await client.graphql({
                query: createUser,
                variables: {
                  input: user,
                },
                authToken: "da2-77k6yg6ybng6lnn4tygjwdclwy",
              });

              props.setUser(user);
              console.log("User created");
            } catch (e: any) {
              console.log(e);
              if (e.code === "ERR_REQUEST_CANCELED") {
                // handle that the user canceled the sign-in flow
              } else {
                // handle other errors
              }
            }
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontFamily: "RubikMono",
    fontSize: 20,
    textAlign: "center",
  },
  button: {
    width: "70%",
    height: 44,
  },
  body: {
    height: "60%",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    height: "40%",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
