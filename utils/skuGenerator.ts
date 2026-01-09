const CATEGORY_PREFIXES: Record<string, string> = {
  'Menswear': 'M',
  'Womenswear': 'W',
  'Accessories': 'A',
  'Outerwear': 'O',
};

export function generateProductCode(name: string): string {
  const words = name.split(' ');
  if (words.length >= 2) {
    return words.slice(0, 2).map(w => w.substring(0, 3).toUpperCase()).join('');
  }
  return name.substring(0, 6).toUpperCase().replace(/\s/g, '');
}

export function generateColorCode(color: string): string {
  const words = color.split(' ');
  if (words.length >= 2) {
    return words.map(w => w.substring(0, 2).toUpperCase()).join('');
  }
  return color.substring(0, 3).toUpperCase();
}

export function generateSKU(
  categoryName: string,
  productCode: string,
  size: string,
  color: string
): string {
  const prefix = CATEGORY_PREFIXES[categoryName] || 'X';
  const sizeCode = size.toUpperCase();
  const colorCode = generateColorCode(color);
  
  return `${prefix}-${productCode}-${sizeCode}-${colorCode}`;
}
