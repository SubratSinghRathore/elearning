// AppBootstrap.tsx

import React from "react";
import { useAuth } from "./context/AuthContext";
import LoadingScreen from "./pages/LoadingScreen";
import RootStack from "./navigator/Stack";

const AppBootstrap = () => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return <RootStack />;
};

export default AppBootstrap;