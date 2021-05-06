import React from "react";
import { Button as ButtonRN } from "react-native";

import PropTypes from "prop-types";
import "./button.css";

export const Button = ({ primary, backgroundColor, size, label, onClick }) => {
  const mode = primary ? "storybook-button--primary" : "storybook-button--secondary";
  return (
    <ButtonRN
      type="button"
      className={["storybook-button", `storybook-button--${size}`, mode].join(" ")}
      style={backgroundColor && { backgroundColor }}
      onPress={onClick}
      title={label}
    />
  );
};

Button.propTypes = {
  primary: PropTypes.bool,
  backgroundColor: PropTypes.string,
  size: PropTypes.oneOf(["small", "medium", "large"]),
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

Button.defaultProps = {
  backgroundColor: null,
  primary: false,
  size: "medium",
  onClick: undefined,
};
