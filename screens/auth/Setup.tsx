import { generateClient } from "aws-amplify/api";
import { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Text,
  Alert,
} from "react-native";
import { updateUser } from "../../src/graphql/mutations";
import React from "react";

export default function Setup(props: {
  setUser: (user: User) => void;
  user: User;
}) {
  const [username, setUsername] = useState<string>();
  const [initialCount, setInitialCount] = useState<string>();
  const [loading, setLoading] = useState(false);
  const client = generateClient();

  const onPress = async () => {
    setLoading(true);

    if (username === undefined || username == "") {
      Alert.alert(
        "No username submitted",
        "Please ensure you choose a username and try again.",
        [{ text: "OK" }]
      );
      return;
    }

    if (initialCount === undefined || initialCount == "") {
      Alert.alert(
        "No initial count submitted",
        "Please ensure you enter an initial count of beers you have drunk in your lifetime so far.",
        [{ text: "OK" }]
      );
      return;
    }

    var parsedCount = parseInt(initialCount);

    if (parsedCount < 0) {
      Alert.alert(
        "Initial count too low",
        "Please ensure your initial beer count is greater than zero.",
        [{ text: "OK" }]
      );
      return;
    }

    const updatedUser: User = {
      id: props.user.id,
      username: username,
      initialCount: parsedCount,
      currentCount: props.user.currentCount,
    };

    const updateRequest = await client.graphql({
      query: updateUser,
      variables: {
        input: updatedUser,
      },
      authToken: "da2-77k6yg6ybng6lnn4tygjwdclwy",
    });

    if (updateRequest.errors) {
      console.warn(updateRequest.errors);
      return;
    }

    props.setUser(updatedUser);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        onChangeText={(text) => setUsername(text)}
        value={username}
        placeholder="Username"
      />
      <TextInput
        style={styles.input}
        onChangeText={(text) => {
          if (text === undefined) {
            console.log("2");
            return;
          }

          var value = parseInt(text);

          if (!Number.isNaN(value)) {
            setInitialCount(value.toString());
          } else {
            setInitialCount("");
          }
        }}
        value={initialCount}
        placeholder="Beer Count"
        keyboardType="numeric"
      />
      <Pressable
        style={styles.button}
        onPress={() => {
          setLoading(true);
          onPress()
            .catch((e: any) => {
              console.log(e);
            })
            .finally(() => {
              setLoading(false);
            });
        }}
      >
        <Text style={styles.text}>Submit</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: "black",
  },
  text: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "bold",
    letterSpacing: 0.25,
    color: "white",
  },
});
