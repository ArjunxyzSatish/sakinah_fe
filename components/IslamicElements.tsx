import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Svg, { Defs, Pattern, Path, Circle, Rect, Line } from 'react-native-svg';

interface ElementProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export const IslamicPattern = ({ color = 'rgba(15, 61, 46, 0.05)' }: { color?: string }) => (
  <Svg style={StyleSheet.absoluteFill}>
    <Defs>
      <Pattern id="islamic" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
        <Path d="M30 0 L60 30 L30 60 L0 30 Z" fill="none" stroke={color} strokeWidth="1" />
        <Path d="M15 15 L45 15 L45 45 L15 45 Z" fill="none" stroke={color} strokeWidth="1" />
        <Circle cx="30" cy="30" r="5" fill={color} opacity="0.5" />
      </Pattern>
    </Defs>
    <Rect x="0" y="0" width="100%" height="100%" fill="url(#islamic)" />
  </Svg>
);

export const Crescent = ({ size = 100, color = 'black', style }: ElementProps) => (
  <Svg viewBox="0 0 100 100" width={size} height={size} style={style}>
    <Path d="M55 5 A45 45 0 1 1 5 55 A35 35 0 1 0 55 5 Z" fill={color} />
    <Path d="M45 40 L48 48 L56 48 L50 53 L52 61 L45 56 L38 61 L40 53 L34 48 L42 48 Z" fill={color} opacity="0.7" />
  </Svg>
);

export const Lantern = ({ size = 100, color = 'black', style }: ElementProps) => {
  const ratio = 60 / 140;
  return (
    <Svg viewBox="0 0 60 140" width={size * ratio} height={size} style={style}>
      <Line x1="30" y1="0" x2="30" y2="30" stroke={color} strokeWidth="1.5" strokeDasharray="4 2" />
      <Circle cx="30" cy="32" r="3" fill="none" stroke={color} strokeWidth="1.5" />
      <Path d="M20 45 Q30 35 40 45 L45 55 L15 55 Z" fill={color} />
      <Path d="M15 55 L45 55 L40 95 L20 95 Z" fill="none" stroke={color} strokeWidth="2" />
      <Line x1="25" y1="55" x2="25" y2="95" stroke={color} strokeWidth="1" opacity="0.5" />
      <Line x1="35" y1="55" x2="35" y2="95" stroke={color} strokeWidth="1" opacity="0.5" />
      <Circle cx="30" cy="75" r="6" fill={color} />
      <Path d="M20 95 L40 95 L35 105 L25 105 Z" fill={color} />
      <Line x1="30" y1="105" x2="30" y2="120" stroke={color} strokeWidth="1.5" />
      <Path d="M27 120 L33 120 L35 135 L25 135 Z" fill={color} opacity="0.8" />
    </Svg>
  );
};

export const OpenBook = ({ size = 100, color = 'black', style }: ElementProps) => {
  const ratio = 100 / 60;
  return (
    <Svg viewBox="0 0 100 60" width={size * ratio} height={size} style={style}>
      <Path d="M20 50 L45 35 L55 35 L80 50 L75 55 L55 40 L45 40 L25 55 Z" fill={color} opacity="0.4" />
      <Path d="M45 35 L50 55 L55 35" stroke={color} strokeWidth="2" fill="none" opacity="0.4" />
      <Path d="M10 25 Q30 15 50 25 Q70 15 90 25 L85 40 Q70 30 50 40 Q30 30 15 40 Z" fill={color} opacity="0.9" />
      <Line x1="50" y1="25" x2="50" y2="40" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <Line x1="20" y1="28" x2="40" y2="24" stroke={color} strokeWidth="1.5" opacity="0.3" />
      <Line x1="22" y1="32" x2="42" y2="28" stroke={color} strokeWidth="1.5" opacity="0.3" />
      <Line x1="60" y1="24" x2="80" y2="28" stroke={color} strokeWidth="1.5" opacity="0.3" />
      <Line x1="58" y1="28" x2="78" y2="32" stroke={color} strokeWidth="1.5" opacity="0.3" />
    </Svg>
  );
};

export const Mandala = ({ size = 100, color = 'black', style }: ElementProps) => (
  <Svg viewBox="0 0 100 100" width={size} height={size} style={style}>
    <Circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
    <Circle cx="50" cy="50" r="30" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
    <Path d="M50 10 L55 45 L90 50 L55 55 L50 90 L45 55 L10 50 L45 45 Z" fill={color} opacity="0.7" />
    <Path d="M22 22 L45 45 M78 22 L55 45 M78 78 L55 55 M22 78 L45 55" stroke={color} strokeWidth="1.5" opacity="0.4" />
    <Circle cx="50" cy="50" r="10" fill={color} opacity="0.9" />
  </Svg>
);

export const Mosque = ({ size = 100, color = 'black', style }: ElementProps) => (
  <Svg viewBox="0 0 100 100" width={size} height={size} style={style}>
    {/* Base */}
    <Path d="M10 80 L90 80 L90 90 L10 90 Z" fill={color} opacity={'0.8'} />
    {/* Central Dome */}
    <Path d="M35 50 Q50 20 65 50 L65 80 L35 80 Z" fill={color} opacity="0.9" />
    <Circle cx="50" cy="18" r="3" fill={color} />
    {/* Minarets */}
    <Path d="M20 30 L25 30 L25 80 L20 80 Z" fill={color} opacity={'0.7'} />
    <Path d="M18 30 L27 30 L22.5 15 Z" fill={color} opacity={'0.9'} />
    <Circle cx="22.5" cy="12" r="2" fill={color} />
    
    <Path d="M75 30 L80 30 L80 80 L75 80 Z" fill={color} opacity={'0.7'} />
    <Path d="M73 30 L82 30 L77.5 15 Z" fill={color} opacity={'0.9'} />
    <Circle cx="77.5" cy="12" r="2" fill={color} />
    
    {/* Main Door */}
    <Path d="M43 80 L43 65 A7 7 0 0 1 57 65 L57 80 Z" fill={color} opacity={'0.5'} />
  </Svg>
);
