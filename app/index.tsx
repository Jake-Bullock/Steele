import { router } from "expo-router";

import supabase from "./lib/supabase";
import { useEffect } from "react";

export default function IndexPage() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/(tabs)/home");
        console.log("no user");
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace("/(tabs)/home");
      } else {
        router.replace("/(auth)/login");
        console.log("no user");
      }
    });
  }, []);
}
