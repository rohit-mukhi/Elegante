// Color palette mappings for the recommendation system
export const colorPalette: Record<string, string> = {
  'Coral': 'rgba(255, 127, 80, 1)',
  'Earth Tones': 'rgba(139, 90, 43, 1)',
  'Emerald': 'rgba(80, 200, 120, 1)',
  'Icy Blue': 'rgba(176, 224, 230, 1)',
  'Jewel Tones': 'rgba(106, 90, 205, 1)',
  'Lavender': 'rgba(230, 230, 250, 1)',
  'Mustard': 'rgba(255, 219, 88, 1)',
  'Neutral Beige': 'rgba(245, 245, 220, 1)',
  'Olive': 'rgba(128, 128, 0, 1)',
  'Peach': 'rgba(255, 218, 185, 1)',
  'Plums': 'rgba(142, 69, 133, 1)',
  'Silver': 'rgba(192, 192, 192, 1)',
  'Soft Pinks': 'rgba(255, 182, 193, 1)',
  'Teal': 'rgba(0, 128, 128, 1)',
  'Warm Red': 'rgba(220, 20, 60, 1)'
}

export const getColorRgba = (colorName: string): string => {
  return colorPalette[colorName] || 'rgba(200, 200, 200, 1)'
}
