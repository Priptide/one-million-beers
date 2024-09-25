import { generateClient } from "aws-amplify/api";
import { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Text,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { updateUser } from "../../src/graphql/mutations";
import React from "react";
import * as Font from "expo-font";

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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Welcome, please enter a username and your current lifetime beer
            count.
          </Text>
        </View>
        <View style={styles.body}>
          <TextInput
            style={styles.input}
            onChangeText={(text) => setUsername(text)}
            value={username}
            placeholder="Your name"
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
        </View>
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
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    height: "20%",
    width: "80%",
    justifyContent: "center",
  },
  title: {
    fontFamily: "RubikMonoOne-Regular",
    fontSize: 18,
    textAlign: "center",
  },
  body: {
    width: "100%",
    height: "30%",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    width: "60%",
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    fontFamily: "RubikMonoOne-Regular",
  },
  button: {
    width: "40%",
    height: 50,
    borderRadius: 40,
    backgroundColor: "#0ba6ff",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 32,
    elevation: 3,
  },
  text: {
    fontFamily: "RubikMonoOne-Regular",
    fontSize: 15,
    color: "white",
  },
});
