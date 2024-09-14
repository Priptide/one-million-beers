import * as AppleAuthentication from "expo-apple-authentication";
import { generateClient } from "aws-amplify/api";
import { View, Text, StyleSheet } from "react-native";
import { createUser } from "../../src/graphql/mutations";
import { getUser } from "../../src/graphql/queries";

export default function Login(props: { setUser: (user: User) => void }) {
  const client = generateClient();

  return (
    <View style={styles.container}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    width: 200,
    height: 44,
  },
});
