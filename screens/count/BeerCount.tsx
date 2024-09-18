import {
  Button,
  Text,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState } from "react";
import CameraPage from "./CameraPage";
import { generateClient } from "aws-amplify/api";
import { onUpdateUser } from "../../src/graphql/subscriptions";
import { searchUsers } from "../../src/graphql/queries";
import {
  SearchableAggregateType,
  SearchableUserAggregateField,
  SearchUsersQuery,
} from "../../src/API";
import { downloadData, getUrl } from "aws-amplify/storage";
import { Subscription } from "expo-apple-authentication";

export default function BeerCount(props: {
  user: User;
  setUser: (user: User) => void;
}) {
  const [showCamera, setShowCamera] = useState(false);
  const [globalCount, setGlobalCount] = useState(0);
  const [initialLoad, setInitialLoad] = useState(false);
  const [mostRecentImage, setMostRecentImage] = useState<RecentImage>();
  const [imagePath, setImagePath] = useState<string>();
  const [subscription, setSubscription] = useState<Subscription>();

  let createSub: any = undefined;
  const client = generateClient();

  const flipCameraState = () => {
    setShowCamera(!showCamera);
  };

  const updateGlobalCount = async () => {
    const initialCount = await client.graphql({
      query: searchUsers,
      variables: {
        aggregates: [
          {
            name: "totalInitialCount",
            type: SearchableAggregateType.sum,
            field: SearchableUserAggregateField.initialCount,
          },
          {
            name: "totalCurrentCount",
            type: SearchableAggregateType.sum,
            field: SearchableUserAggregateField.currentCount,
          },
        ],
      },
    });

    var result = initialCount.data as SearchUsersQuery;

    var fullTotal = result.searchUsers?.aggregateItems
      .map((x) =>
        x?.result?.__typename !== "SearchableAggregateBucketResult"
          ? x?.result?.value
          : 0
      )
      .reduce((a, b) => (a ?? 0) + (b ?? 0), 0);

    console.log(result.searchUsers?.aggregateItems);
    console.log(fullTotal);
    setGlobalCount(1000000 - (fullTotal ?? 0));

    try {
      var recentS3 = await downloadData({
        path: `public/most_recent_image.json`,
      }).result;

      console.log(recentS3);

      var recentS3Json = await recentS3.body.text();
      setMostRecentImage(JSON.parse(recentS3Json) as RecentImage);
    } catch (error) {
      console.log(error);
    }
  };

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
          updateGlobalCount();
        },
        error: (error) => console.warn(error),
      });
    }

    if (!initialLoad) {
      updateGlobalCount();
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
      <View style={styles.countContainer}>
        <Text style={styles.title}>Beers left to drink:</Text>
        <View style={styles.numberContainer}>
          {globalCount
            .toString()
            .padStart(7, "0")
            .split("")
            .slice(-7)
            .map((value, i) => {
              return (
                <View style={styles.numberPanel} key={i}>
                  <Text style={styles.numberText}>{value}</Text>
                </View>
              );
            })}
        </View>
      </View>
      {imagePath && mostRecentImage ? (
        <View style={styles.lastBeerContainer}>
          <Text style={styles.lastBeerText}>
            Last beer drank by: {mostRecentImage.username}
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
  countContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: "35%",
  },
  title: {
    fontFamily: "RubikMono",
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
    borderRadius: 15,
  },
  lastBeerImage: {
    width: 200,
    height: 200,
  },
  lastBeerText: {
    fontFamily: "RubikMono",
    fontSize: 14,
  },
  numberContainer: {
    flexDirection: "row",
    width: "90%",
    height: 100,
    alignItems: "center",
    justifyContent: "center",
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
    fontFamily: "RubikMono",
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
    fontFamily: "RubikMono",
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
    fontFamily: "RubikMono",
    fontSize: 15,
    color: "white",
  },
});
