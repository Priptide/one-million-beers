import {
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
import { uploadData } from "aws-amplify/storage";
import { generateClient } from "aws-amplify/api";
import { updateUser } from "../../src/graphql/mutations";

export default function CameraPage(props: {
  closeCamera: () => void;
  user: User;
  setUser: (user: User) => void;
}) {
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
    if (!camera.current) return;

    const photo = await camera.current.takePictureAsync();

    if (!photo) return;

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

      const result = await uploadData({
        path: `public/images/${props.user.id}/${Date.now().toString()}.jpg`,
        data: blob,
      }).result;

      const updatedUser: User = {
        id: props.user.id,
        username: props.user.username,
        initialCount: props.user.initialCount,
        currentCount: props.user.currentCount + 1,
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

      props.setUser(updatedUser);

      props.closeCamera();
    } catch (error) {
      console.log("Error : ", error);
    }

    setLoading(false);
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
                  backgroundColor: "#fff",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 22,
                  }}
                >
                  Submit beer
                </Text>
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
              onPress={props.closeCamera}
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
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
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
