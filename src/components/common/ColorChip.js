import React from 'react';
import { Chip, makeStyles } from '@material-ui/core';

const PALETTE_COLORS = ['success', 'warning', 'error'];

const useStyles = makeStyles((theme) => Object.fromEntries(PALETTE_COLORS.flatMap((color) => [
  [color, {
    backgroundColor: theme.palette[color].main,
    color: theme.palette[color].contrastText,
  }],
  [`${color}Outlined`, {
    borderColor: theme.palette[color].main,
    color: theme.palette[color].main,
  }],
])));

// A Chip that also takes the success, warning and error palette colours.
// Chip itself accepts default, primary and secondary only.
function ColorChip({
  color = 'default', variant = 'default', size, label,
}) {
  const classes = useStyles();
  if (!PALETTE_COLORS.includes(color)) {
    return <Chip color={color} variant={variant} size={size} label={label} />;
  }
  const className = classes[variant === 'outlined' ? `${color}Outlined` : color];
  return <Chip variant={variant} className={className} size={size} label={label} />;
}

export default ColorChip;
