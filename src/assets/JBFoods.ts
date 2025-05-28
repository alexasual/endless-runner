// This file contains information about JB Foods assets
// Replace these with actual food images when available

export const JB_FOODS = [
  {
    id: 'burger',
    name: 'Burger',
    points: 3,
    color: '#8B4513'
  },
  {
    id: 'hotdog',
    name: 'Hot Dog',
    points: 3,
    color: '#FF6347'
  },
  {
    id: 'pizza',
    name: 'Pizza Slice',
    points: 3,
    color: '#FFD700'
  },
  {
    id: 'drink',
    name: 'Soft Drink',
    points: 3,
    color: '#87CEFA'
  },
  {
    id: 'fries',
    name: 'French Fries',
    points: 3,
    color: '#F5DEB3'
  }
];

// You can replace these placeholder functions with actual texture loading
// when JB Foods assets are available

export const loadJBFoodTexture = (foodId: string) => {
  // In a real implementation, this would load textures for the 3D models
  // For now, we're using simple geometric shapes with colors
  return null;
};

export const getJBFoodById = (id: string) => {
  return JB_FOODS.find(food => food.id === id);
};

export const getRandomJBFood = () => {
  const randomIndex = Math.floor(Math.random() * JB_FOODS.length);
  return JB_FOODS[randomIndex];
};
