import { Link, Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function SettingTypeScreen() {
  const {settingType} = useLocalSearchParams();

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Settings Details" }} />
      <View style={styles.container}>
        <Text style={{fontSize: 24}}>Detail page of Settings tab</Text>
        <Text style={{fontSize: 24, marginTop: 8}}>{settingType}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  link: {},
});
