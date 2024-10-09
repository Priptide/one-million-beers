import {
  ActivityIndicator,
  Alert,
  Button,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  CameraCapturedPicture,
  CameraType,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import React, { useRef } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { uploadData, remove } from "aws-amplify/storage";
import { generateClient } from "aws-amplify/api";
import { updateUser } from "../../src/graphql/mutations";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<RootStackParamList, "CameraPage">;

export default function CameraPage({ route, navigation }: Props) {
  const { user } = route.params;
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();

  const [previewVisible, setPreviewVisible] = useState(false);
  const [capturedImage, setCapturedImage] = useState<
    CameraCapturedPicture | undefined
  >(undefined);

  const [loading, setLoading] = useState(false);

  const camera = useRef<CameraView>(null);
  const client = generateClient();

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  const __takePicture = async () => {
    setLoading(false);

    if (!camera.current) {
      Alert.alert("No current camera", "Internal error.", [{ text: "OK" }]);
      return;
    }

    const photo = await camera.current.takePictureAsync();

    if (!photo) {
      Alert.alert("No photo taken", "Internal error.", [{ text: "OK" }]);
      return;
    }

    console.log(photo);
    setPreviewVisible(true);
    setCapturedImage(photo);
  };

  const onImageSubmit = async () => {
    console.log("Submitting to S3");

    if (!capturedImage) return;

    setLoading(true);

    try {
      const response = await fetch(capturedImage.uri);
      const blob = await response.blob();

      const recentImage: RecentImage = {
        path: `public/images/${user.id}/${Date.now().toString()}.jpg`,
        username: user.username ?? "Unknown User",
        id: user.id,
      };

      await uploadData({
        path: `public/images/${user.id}/${Date.now().toString()}.jpg`,
        data: blob,
      }).result;

      try {
        await remove({
          path: `public/most_recent_image.json`,
        });
      } catch (error) {}

      const res = await uploadData({
        path: `public/most_recent_image.json`,
        data: JSON.stringify(recentImage),
      }).result;

      console.log("Res");
      console.log(res);

      const updatedUser: User = {
        id: user.id,
        username: user.username,
        initialCount: user.initialCount,
        currentCount: user.currentCount + 1,
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
      }

      // setUser(updatedUser);

      navigation.pop();
    } catch (error: any) {
      console.log("Error : ", error);
      Alert.alert("Internal error", error ?? "Unknown", [{ text: "OK" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {previewVisible ? (
        <ImageBackground
          source={{ uri: capturedImage && capturedImage.uri }}
          style={{
            flex: 1,
          }}
        >
          <View style={styles.header}>
            <Ionicons
              name="close-sharp"
              size={30}
              color="white"
              onPress={() => {
                setPreviewVisible(false);
                setCapturedImage(undefined);
              }}
            />
          </View>
          <View style={styles.buttonContainer}>
            <View
              style={{
                alignSelf: "center",
                flex: 1,
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                onPress={onImageSubmit}
                disabled={loading}
                style={{
                  width: "100%",
                  height: 60,
                  bottom: 0,
                  borderRadius: 50,
                  backgroundColor: "#0ba6ff",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#0000ff" />
                ) : (
                  <Text style={styles.text}>Submit beer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      ) : (
        <CameraView style={styles.camera} facing={facing} ref={camera}>
          <View style={styles.header}>
            <Ionicons
              name="arrow-back-sharp"
              size={28}
              color="white"
              onPress={() => navigation.pop()}
            />
            <MaterialCommunityIcons
              name="camera-flip-outline"
              size={30}
              color="white"
              onPress={toggleCameraFacing}
            />
          </View>
          <View style={styles.buttonContainer}>
            <View
              style={{
                alignSelf: "center",
                flex: 1,
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                onPress={__takePicture}
                style={{
                  width: 70,
                  height: 70,
                  bottom: 0,
                  borderRadius: 50,
                  backgroundColor: "#fff",
                }}
              />
            </View>
          </View>
        </CameraView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
    flex: 1,
    width: "100%",
    padding: 70,
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    alignSelf: "flex-end",
    alignItems: "center",
    backgroundColor: "#00aeff",
  },
  text: {
    fontSize: 16,
    color: "white",
    fontFamily: "RubikMonoOne-Regular",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 15,
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
