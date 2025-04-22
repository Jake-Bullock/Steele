import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import GlobalStyles from '../../assets/styles/GlobalStyles';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  disabled?: boolean;
  style?: object;
  textStyle?: object;
};

const Button = ({
  title,
  onPress,
  variant = 'secondary',
  isLoading = false,
  disabled = false,
  style,
  textStyle
}: ButtonProps): JSX.Element => {
  
  // Determine the button style based on variant
  const getButtonStyle = () => {
    switch(variant) {
      case 'primary':
        return [GlobalStyles.button, GlobalStyles.primaryButton];
      case 'danger':
        return [GlobalStyles.button, styles.dangerButton];
      default:
        return [GlobalStyles.button];
    }
  };
  
  // Determine the text style based on variant
  const getTextStyle = () => {
    switch(variant) {
      case 'primary':
      case 'danger':
        return [GlobalStyles.buttonText, GlobalStyles.primaryButtonText];
      default:
        return [GlobalStyles.buttonText];
    }
  };
  
  return (
    <TouchableOpacity
      style={[
        ...getButtonStyle(),
        disabled || isLoading ? styles.disabledButton : {},
        style
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <ActivityIndicator 
          color={variant === 'secondary' ? '#000000' : '#ffffff'} 
          size="small"
        />
      ) : (
        <Text style={[...getTextStyle(), textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  disabledButton: {
    opacity: 0.7,
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  }
});

export default Button;