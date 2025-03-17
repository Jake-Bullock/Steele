import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

type LoadingIndicatorProps = {
  size?: 'small' | 'large';
  color?: string;
  style?: object;
};

const LoadingIndicator = ({ 
  size = 'large', 
  color = '#000000',
  style 
}: LoadingIndicatorProps): JSX.Element => (
  <View style={[styles.container, style]}>
    <ActivityIndicator size={size} color={color} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default LoadingIndicator;