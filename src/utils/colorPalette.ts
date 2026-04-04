// Color palette mappings for the recommendation system

// Expanded color families - each base category maps to multiple specific shades
const colorExpansion: Record<string, string[]> = {
  'Coral': ['Coral', 'Salmon', 'Peach Coral', 'Light Coral', 'Deep Coral'],
  'Earth Tones': ['Terracotta', 'Sienna', 'Umber', 'Clay Brown', 'Sand'],
  'Emerald': ['Emerald', 'Forest Green', 'Jade', 'Sea Green', 'Hunter Green'],
  'Icy Blue': ['Powder Blue', 'Sky Blue', 'Periwinkle', 'Baby Blue', 'Ice Blue'],
  'Jewel Tones': ['Sapphire Blue', 'Ruby Red', 'Emerald Green', 'Amethyst Purple', 'Topaz Yellow'],
  'Lavender': ['Lavender', 'Lilac', 'Mauve', 'Periwinkle Purple', 'Wisteria'],
  'Mustard': ['Mustard Yellow', 'Golden Yellow', 'Honey', 'Amber', 'Saffron'],
  'Neutral Beige': ['Beige', 'Cream', 'Ivory', 'Taupe', 'Linen'],
  'Olive': ['Olive Green', 'Sage', 'Moss', 'Khaki', 'Army Green'],
  'Peach': ['Peach', 'Apricot', 'Melon', 'Cantaloupe', 'Papaya'],
  'Plums': ['Plum', 'Burgundy', 'Wine', 'Mulberry', 'Eggplant'],
  'Silver': ['Silver', 'Platinum', 'Steel Gray', 'Pewter', 'Chrome'],
  'Soft Pinks': ['Blush', 'Rose', 'Baby Pink', 'Dusty Rose', 'Ballet Pink'],
  'Teal': ['Teal', 'Turquoise', 'Aqua', 'Cyan', 'Ocean Blue'],
  'Warm Red': ['Crimson', 'Scarlet', 'Cherry Red', 'Brick Red', 'Tomato Red']
}

export const colorPalette: Record<string, string> = {
  // Coral family
  'Coral': 'rgba(255, 127, 80, 1)',
  'Salmon': 'rgba(250, 128, 114, 1)',
  'Peach Coral': 'rgba(255, 160, 122, 1)',
  'Light Coral': 'rgba(240, 128, 128, 1)',
  'Deep Coral': 'rgba(255, 99, 71, 1)',
  
  // Earth Tones family
  'Terracotta': 'rgba(204, 78, 92, 1)',
  'Sienna': 'rgba(160, 82, 45, 1)',
  'Umber': 'rgba(99, 81, 71, 1)',
  'Clay Brown': 'rgba(139, 90, 43, 1)',
  'Sand': 'rgba(194, 178, 128, 1)',
  
  // Emerald family
  'Emerald': 'rgba(80, 200, 120, 1)',
  'Forest Green': 'rgba(34, 139, 34, 1)',
  'Jade': 'rgba(0, 168, 107, 1)',
  'Sea Green': 'rgba(46, 139, 87, 1)',
  'Hunter Green': 'rgba(53, 94, 59, 1)',
  
  // Icy Blue family
  'Powder Blue': 'rgba(176, 224, 230, 1)',
  'Sky Blue': 'rgba(135, 206, 235, 1)',
  'Periwinkle': 'rgba(204, 204, 255, 1)',
  'Baby Blue': 'rgba(137, 207, 240, 1)',
  'Ice Blue': 'rgba(175, 238, 238, 1)',
  
  // Jewel Tones family
  'Sapphire Blue': 'rgba(15, 82, 186, 1)',
  'Ruby Red': 'rgba(155, 17, 30, 1)',
  'Emerald Green': 'rgba(80, 200, 120, 1)',
  'Amethyst Purple': 'rgba(153, 102, 204, 1)',
  'Topaz Yellow': 'rgba(255, 200, 124, 1)',
  
  // Lavender family
  'Lavender': 'rgba(230, 230, 250, 1)',
  'Lilac': 'rgba(200, 162, 200, 1)',
  'Mauve': 'rgba(224, 176, 255, 1)',
  'Periwinkle Purple': 'rgba(195, 177, 225, 1)',
  'Wisteria': 'rgba(201, 160, 220, 1)',
  
  // Mustard family
  'Mustard Yellow': 'rgba(255, 219, 88, 1)',
  'Golden Yellow': 'rgba(255, 223, 0, 1)',
  'Honey': 'rgba(235, 180, 50, 1)',
  'Amber': 'rgba(255, 191, 0, 1)',
  'Saffron': 'rgba(244, 196, 48, 1)',
  
  // Neutral Beige family
  'Beige': 'rgba(245, 245, 220, 1)',
  'Cream': 'rgba(255, 253, 208, 1)',
  'Ivory': 'rgba(255, 255, 240, 1)',
  'Taupe': 'rgba(184, 175, 165, 1)',
  'Linen': 'rgba(250, 240, 230, 1)',
  
  // Olive family
  'Olive Green': 'rgba(128, 128, 0, 1)',
  'Sage': 'rgba(188, 184, 138, 1)',
  'Moss': 'rgba(138, 154, 91, 1)',
  'Khaki': 'rgba(195, 176, 145, 1)',
  'Army Green': 'rgba(75, 83, 32, 1)',
  
  // Peach family
  'Peach': 'rgba(255, 218, 185, 1)',
  'Apricot': 'rgba(251, 206, 177, 1)',
  'Melon': 'rgba(253, 188, 180, 1)',
  'Cantaloupe': 'rgba(255, 191, 145, 1)',
  'Papaya': 'rgba(255, 239, 213, 1)',
  
  // Plums family
  'Plum': 'rgba(142, 69, 133, 1)',
  'Burgundy': 'rgba(128, 0, 32, 1)',
  'Wine': 'rgba(114, 47, 55, 1)',
  'Mulberry': 'rgba(197, 75, 140, 1)',
  'Eggplant': 'rgba(97, 64, 81, 1)',
  
  // Silver family
  'Silver': 'rgba(192, 192, 192, 1)',
  'Platinum': 'rgba(229, 228, 226, 1)',
  'Steel Gray': 'rgba(169, 169, 169, 1)',
  'Pewter': 'rgba(150, 168, 161, 1)',
  'Chrome': 'rgba(219, 226, 233, 1)',
  
  // Soft Pinks family
  'Blush': 'rgba(255, 182, 193, 1)',
  'Rose': 'rgba(255, 102, 204, 1)',
  'Baby Pink': 'rgba(244, 194, 194, 1)',
  'Dusty Rose': 'rgba(201, 160, 160, 1)',
  'Ballet Pink': 'rgba(255, 209, 220, 1)',
  
  // Teal family
  'Teal': 'rgba(0, 128, 128, 1)',
  'Turquoise': 'rgba(64, 224, 208, 1)',
  'Aqua': 'rgba(0, 255, 255, 1)',
  'Cyan': 'rgba(0, 183, 235, 1)',
  'Ocean Blue': 'rgba(0, 119, 190, 1)',
  
  // Warm Red family
  'Crimson': 'rgba(220, 20, 60, 1)',
  'Scarlet': 'rgba(255, 36, 0, 1)',
  'Cherry Red': 'rgba(222, 49, 99, 1)',
  'Brick Red': 'rgba(203, 65, 84, 1)',
  'Tomato Red': 'rgba(255, 99, 71, 1)'
}

export const getColorRgba = (colorName: string): string => {
  return colorPalette[colorName] || 'rgba(200, 200, 200, 1)'
}

// Expand base color categories into specific shades with randomization
export const expandColors = (baseColors: string[], maxColors: number = 6): string[] => {
  const expandedColors: string[] = []
  
  for (const baseColor of baseColors) {
    const shades = colorExpansion[baseColor]
    if (shades && shades.length > 0) {
      // Shuffle the shades array to get different colors each time
      const shuffled = [...shades].sort(() => Math.random() - 0.5)
      // Take a random subset (2-3 colors per category)
      const count = Math.min(Math.floor(Math.random() * 2) + 2, shades.length)
      expandedColors.push(...shuffled.slice(0, count))
    }
  }
  
  // Shuffle the final array and limit to maxColors
  const finalColors = expandedColors.sort(() => Math.random() - 0.5)
  return finalColors.slice(0, Math.min(maxColors, finalColors.length))
}
