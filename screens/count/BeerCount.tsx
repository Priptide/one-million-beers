import { Button, Text, View } from "react-native";
import React, { useState } from "react";

import CameraPage from "./CameraPage";

export default function BeerCount(props: { user: User }) {
  const [showCamera, setShowCamera] = useState(false);

  const flipCameraState = () => {
    setShowCamera(!showCamera);
  };

  return showCamera ? (
    <CameraPage closeCamera={flipCameraState} />
  ) : (
    <View>
      <Text>Logged in as {props.user.id}</Text>
      <Button onPress={flipCameraState} title="Add beer" />
    </View>
  );
}
