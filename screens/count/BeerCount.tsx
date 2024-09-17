import { Button, Text, View } from "react-native";
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

export default function BeerCount(props: {
  user: User;
  setUser: (user: User) => void;
}) {
  const [showCamera, setShowCamera] = useState(false);
  const [globalCount, setGlobalCount] = useState(0);
  const [initialLoad, setInitialLoad] = useState(false);
  const client = generateClient();

  const flipCameraState = () => {
    setShowCamera(!showCamera);
  };

  const createSub = client.graphql({ query: onUpdateUser }).subscribe({
    next: ({ data }) => {
      updateGlobalCount();
    },
    error: (error) => console.warn(error),
  });

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
  };

  useEffect(() => {
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
    <View>
      <Text>Total count globally - {globalCount}</Text>
      <Text>
        Your current count -{" "}
        {(props.user.initialCount ?? 0) + props.user.currentCount}
      </Text>
      <Button onPress={flipCameraState} title="Add beer" />
    </View>
  );
}
