import { categories } from './model';

export const categoryPalette = [
  '#DDC76F', '#D17F8B', '#C6C4C6', '#86B7D5', '#DFA07E', '#D5BFA2', '#A7CE7E',
  '#D9AFC0', '#72B9B0', '#9FAED8', '#BE9DCE', '#8CCBC8', '#E0AD8F', '#B3A4D2',
];

export function categoryColor(categoryId: string) {
  return categoryPalette[categories.findIndex(category => category.id === categoryId)] ?? '#C6C4C6';
}
