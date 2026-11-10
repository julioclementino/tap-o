export const theme = {
  colors: {
    background: '#EAF6FF',
    primary: '#FFD447',
    text: '#17365D',
    green: '#527A35',
    surface: '#FFFFFF',
    muted: '#49627D',
    border: '#B9CDDD',
    softGreen: '#EDF4E7',
    danger: '#9A3038',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  type: { small: 16, body: 19, label: 20, subtitle: 24, title: 32, hero: 40 },
  radius: { small: 12, card: 24, pill: 999 },
};
export const contrastColors = {
  ...theme.colors,
  background: '#FFFFFF',
  text: '#0B203A',
  muted: '#17365D',
  border: '#17365D',
  green: '#36551E',
  softGreen: '#FFFFFF',
};
