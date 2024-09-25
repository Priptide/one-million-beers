import {
  Button,
  Text,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import CameraPage from "./CameraPage";
import { generateClient, head } from "aws-amplify/api";
import { onUpdateUser } from "../../src/graphql/subscriptions";
import { searchUsers } from "../../src/graphql/queries";
import {
  SearchableAggregateType,
  SearchableUserAggregateField,
  SearchUsersQuery,
} from "../../src/API";
import { downloadData, getUrl } from "aws-amplify/storage";
import { Subscription } from "expo-apple-authentication";
import BeerCounter from "./BeerCounter";

export default function BeerCount(props: {
  user: User;
  setUser: (user: User) => void;
}) {
  const [showCamera, setShowCamera] = useState(false);
  const [initialLoad, setInitialLoad] = useState(false);
  const [mostRecentImage, setMostRecentImage] = useState<RecentImage>();
  const [imagePath, setImagePath] = useState<string>();
  const [subscription, setSubscription] = useState<Subscription>();

  let createSub: any = undefined;
  const client = generateClient();

  const flipCameraState = () => {
    setShowCamera(!showCamera);
  };

  const updateRecentImage = useCallback(async () => {
    try {
      var recentS3 = await downloadData({
        path: `public/most_recent_image.json`,
        // options: {
        //   cacheControl: "no-cache",
        // },
      }).result;

      console.log(recentS3);

      var recentS3Json = await recentS3.body.text();

      console.log(recentS3Json);
      setMostRecentImage(JSON.parse(recentS3Json) as RecentImage);
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    if (mostRecentImage)
      getUrl({
        path: mostRecentImage.path,
      }).then((path) => {
        setImagePath(path.url.toString());
      });
  }, [mostRecentImage]);

  useEffect(() => {
    if (createSub === undefined) {
      createSub = client.graphql({ query: onUpdateUser }).subscribe({
        next: ({ data }) => {
          updateRecentImage();
        },
        error: (error) => console.warn(error),
      });
    }

    if (!initialLoad) {
      updateRecentImage();
      setInitialLoad(true);
    }
  }, []);

  return showCamera ? (
    <CameraPage
      closeCamera={flipCameraState}
      user={props.user}
      setUser={props.setUser}
    />
  ) : (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            {
              textAlign: "center",
              lineHeight: 30,
              fontSize: 20,
              color: "#0ba6ff",
            },
          ]}
        >
          Hi {props.user.username},{"\n"}Time for a beer?
        </Text>
      </View>
      <BeerCounter />
      {imagePath && mostRecentImage ? (
        <View style={styles.lastBeerContainer}>
          <Text style={[styles.lastBeerText]}>
            Last beer drank by:{" "}
            <Text
              style={{
                color:
                  mostRecentImage.id == props.user.id ? "#0ba6ff" : "black",
              }}
            >
              {mostRecentImage.username}
            </Text>
          </Text>
          <View style={styles.lastBeerImageContainer}>
            <Image
              source={{
                uri: imagePath,
              }}
              style={styles.lastBeerImage}
            />
          </View>
        </View>
      ) : (
        <View />
      )}
      <Text style={styles.subtitle}>Beers consumed</Text>
      <View style={styles.userNumberContainer}>
        {((props.user.initialCount ?? 0) + props.user.currentCount)
          .toString()
          .split("")
          .map((value, i) => {
            return (
              <View key={i} style={styles.numberPanel}>
                <Text style={styles.numberText}>{value}</Text>
              </View>
            );
          })}
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.addButton} onPress={flipCameraState}>
          <Text style={styles.addButtonText}>Add beer</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    height: "18%",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: "7%",
  },
  title: {
    fontFamily: "RubikMonoOne-Regular",
    fontSize: 18,
  },
  lastBeerContainer: {
    height: "35%",
    width: "100%",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  lastBeerImageContainer: {
    backgroundColor: "#5b6b5f",
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  lastBeerImage: {
    width: 200,
    height: 200,
  },
  lastBeerText: {
    fontFamily: "RubikMonoOne-Regular",
    fontSize: 14,
  },
  numberPanel: {
    width: "13%",
    height: "70%",
    borderRadius: 20,
    backgroundColor: "#5b6b5f",
    color: "white",
    alignItems: "center",
    marginHorizontal: 2,
    justifyContent: "center",
  },
  numberText: {
    color: "white",
    fontFamily: "RubikMonoOne-Regular",
    fontSize: 24,
  },
  userNumberContainer: {
    flexDirection: "row",
    width: "90%",
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: {
    fontFamily: "RubikMonoOne-Regular",
    fontSize: 15,
  },
  footer: {
    width: "100%",
    height: "20%",
    alignItems: "center",
    paddingTop: "10%",
  },
  addButton: {
    width: "50%",
    height: 60,
    borderRadius: 40,
    backgroundColor: "#0ba6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    fontFamily: "RubikMonoOne-Regular",
    fontSize: 15,
    color: "white",
  },
});
