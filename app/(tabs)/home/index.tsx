import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Home" }} />
      <View style={styles.container}>
        <Text>Index of Home tab</Text>
        <Link href={"/home/detail-page"}>
        <Text style={styles.link}>Go to Detail page</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16
  },
  link: {
    color: "white", // Change text color for better contrast
    backgroundColor: "blue", // Button background color
    paddingVertical: 10, // Vertical padding for button height
    paddingHorizontal: 20, // Horizontal padding for button width
    borderRadius: 5, // Rounded corners
    textAlign: "center",
  },
});
