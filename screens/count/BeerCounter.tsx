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

export default function BeerCounter() {
  const [globalCount, setGlobalCount] = useState(0);
  const [initialLoad, setInitialLoad] = useState(false);

  let createSub: any = undefined;

  const client = generateClient();

  const updateGlobalCount = useCallback(async () => {
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
  }, []);

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

  return (
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
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: "RubikMonoOne-Regular",
    fontSize: 18,
  },
  countContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
    fontFamily: "RubikMonoOne-Regular",
    fontSize: 24,
  },
});
