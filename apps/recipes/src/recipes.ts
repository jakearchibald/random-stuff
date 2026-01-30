interface Recipe {
  // Vegetables
  'Onion (unit)'?: number;
  'Spring onion (unit)'?: number;
  'Carrot (g)'?: number;
  'Red pepper (unit)'?: number;
  'Parsnip (g)'?: number;
  'Courgette (unit)'?: number;
  'Celery (stalk)'?: number;
  'Tomato (unit)'?: number;
  'Grape tomatoes (g)'?: number;
  'Chopped tomatoes (400g can)'?: number;

  // Meat & Protein
  'Chicken (g)'?: number;
  'Chicken breast (unit)'?: number;
  'Steak mince (g)'?: number;
  'Cumberland sausage meat (g)'?: number;
  'Bacon (pack)'?: number;

  // Cheese & Dairy
  'Cheese (g)'?: number;
  'Halloumi (block)'?: number;
  'Philadelphia (g)'?: number;
  'Sour cream (ml)'?: number;
  'Single cream (ml)'?: number;
  'Double cream (ml)'?: number;
  'Milk (ml)'?: number;
  'Coconut milk (ml)'?: number;
  'Mozzarella (ball)'?: number;
  'Grated parmesan'?: boolean;
  Butter?: boolean;

  // Processed meats
  'Chorizo ring (unit)'?: number;
  'Nduja paste (g)'?: number;

  // Vegetables & Aromatics
  'Mushroom (g)'?: number;
  'Garlic (clove)'?: number;
  'Chillies (unit)'?: number;

  // Herbs & Spices
  'Dry thyme'?: boolean;
  'Fresh tarragon (pack)'?: number;
  'Mixed herbs (tsp)'?: number;
  'Thai basil (pack)'?: number;
  'Fresh basil (pack)'?: number;
  'Rocket (pack)'?: number;
  'Coriander (sprig)'?: number;
  'Roasting herbs (pack)'?: number;
  'Curry powder'?: boolean;
  'Cumin seeds (tsp)'?: number;
  'Cajun spice (tbsp)'?: number;
  'Cajun seasoning'?: boolean;
  'Chilli powder (tsp)'?: number;
  'Mustard powder (tsp)'?: number;
  Pepper?: boolean;
  'MSG (tsp)'?: number;

  // Stock
  'Vegetable stock (unit)'?: number;
  'Chicken stock (unit)'?: number;
  'Beef stock (unit)'?: number;

  // Asian ingredients
  'Galangal paste (g)'?: number;
  'Lemongrass (stalk)'?: number;
  'Kaffir lime leaves (unit)'?: number;
  'Fish sauce (tbsp)'?: number;
  'Fish sauce (ml)'?: number;
  'Oyster sauce (tsp)'?: number;
  'Soy sauce (tsp)'?: number;
  'Thai red curry paste (jar)'?: number;
  'Red curry paste (g)'?: number;

  // Pasta & Noodles
  'Dry egg noodles (g)'?: number;
  'Pasta (g)'?: number;
  'Tortellini (pack)'?: number;

  // Rice & Grains
  'Jasmine rice (serving)'?: number;
  'Split red lentils (g)'?: number;
  'Kidney beans (400g)'?: number;

  // Sauces & Condiments
  'Pesto (g)'?: number;
  'Sriracha (tbsp)'?: number;
  'Tomato puree (tbsp)'?: number;
  Mayo?: boolean;
  Bovril?: boolean;

  // Sweeteners
  'Honey (tbsp)'?: number;
  Honey?: boolean;
  'Sugar (tsp)'?: number;
  'Light brown sugar (tbsp)'?: number;
  'Granulated sugar (ml)'?: number;

  // Citrus
  'Lime (juice)'?: number;

  // Other
  'Eggs (unit)'?: number;
  'Chinese curry blocks (serving)'?: number;

  // Spirits & Liqueurs
  'Amaretto (ml)'?: number;
  'Bourbon (ml)'?: number;
  'Whiskey (ml)'?: number;
  'Aperol (ml)'?: number;

  // Wine & Champagne
  'Prosecco (ml)'?: number;

  // Mixers & Garnishes
  'Lemonade (ml)'?: number;
  'Lemon juice (ml)'?: number;
  'Simple syrup (tsp)'?: number;
  'Egg white (ml)'?: number;
  Bitters?: boolean;
}

export const recipes: Record<string, Recipe> = {
  'Curry noodle soup': {
    'Chinese curry blocks (serving)': 4,
    'Onion (unit)': 1,
    'Carrot (g)': 160,
    'Chicken (g)': 255,
    'Dry egg noodles (g)': 45,
    'Dry thyme': true,
    Pepper: true,
    'Chillies (unit)': 3,
  },
  'Creamy pasta sauce': {
    'Pesto (g)': 190,
    'Onion (unit)': 1,
    'Garlic (clove)': 5,
    'Chorizo ring (unit)': 1,
    'Chillies (unit)': 4,
    'Philadelphia (g)': 280,
    'Double cream (ml)': 300,
    'Mushroom (g)': 250,
    'Nduja paste (g)': 70,
    'MSG (tsp)': 1,
    Pepper: true,
  },
  Frittata: {
    'Cumberland sausage meat (g)': 150,
    'Red pepper (unit)': 0.5,
    'Onion (unit)': 1,
    'Eggs (unit)': 6,
    'Cheese (g)': 55,
    'MSG (tsp)': 1,
    Pepper: true,
    'Chillies (unit)': 3,
  },
  'Halloumi stuffed chicken': {
    'Chicken breast (unit)': 2,
    'Halloumi (block)': 1,
    'Cajun spice (tbsp)': 1,
    'Sriracha (tbsp)': 2,
    'Honey (tbsp)': 2,
    Mayo: true,
  },
  'Thai basil stir fry': {
    'Thai basil (pack)': 1,
    'Chicken (g)': 225,
    'Spring onion (unit)': 1,
    'Garlic (clove)': 2,
    'Chillies (unit)': 3,
    'Oyster sauce (tsp)': 2,
    'Soy sauce (tsp)': 2,
    'Sugar (tsp)': 1,
    'Jasmine rice (serving)': 2,
  },
  'Carrot & parsnip soup': {
    'Curry powder': true,
    'Carrot (g)': 250,
    'Parsnip (g)': 150,
    'Chillies (unit)': 3,
    'Milk (ml)': 125,
    'Vegetable stock (unit)': 2,
    'Onion (unit)': 1,
    'Garlic (clove)': 3,
    'MSG (tsp)': 1,
  },
  'Carrot lentil & cumin soup': {
    'Curry powder': true,
    'Carrot (g)': 400,
    'Chillies (unit)': 3,
    'Cumin seeds (tsp)': 2,
    'Split red lentils (g)': 140,
    'Milk (ml)': 125,
    'Vegetable stock (unit)': 2,
    'Onion (unit)': 1,
    'MSG (tsp)': 1,
  },
  'Tom Yum soup': {
    'Chillies (unit)': 4,
    'Galangal paste (g)': 90,
    'Lemongrass (stalk)': 2,
    'Garlic (clove)': 3,
    'Kaffir lime leaves (unit)': 6,
    'Fish sauce (tbsp)': 2,
    'Coriander (sprig)': 4,
    'Grape tomatoes (g)': 100,
    'Chicken (g)': 300,
    'Lime (juice)': 1,
    'Mushroom (g)': 200,
    'Chicken stock (unit)': 2,
    'Light brown sugar (tbsp)': 1,
  },
  'Chicken & Tarragon soup': {
    'Onion (unit)': 1,
    'Celery (stalk)': 3,
    'Carrot (g)': 160,
    'Garlic (clove)': 2,
    'Chicken (g)': 250,
    'Fresh tarragon (pack)': 1,
    'Chicken stock (unit)': 2,
    'Chillies (unit)': 3,
    Pepper: true,
    'MSG (tsp)': 1,
  },
  'Chicken and mushroom soup': {
    'Chicken (g)': 200,
    'Mushroom (g)': 100,
    'Pasta (g)': 150,
    'Mixed herbs (tsp)': 1,
    'Chicken stock (unit)': 2,
    'Chillies (unit)': 3,
  },
  'Chilli bean soup': {
    'Onion (unit)': 1,
    'Carrot (g)': 60,
    'Kidney beans (400g)': 1,
    'Chopped tomatoes (400g can)': 1,
    'Tomato puree (tbsp)': 1,
    'Chilli powder (tsp)': 1,
    'Vegetable stock (unit)': 2,
  },
  'Creamy beef and mushroom soup': {
    'Sour cream (ml)': 100,
    'Steak mince (g)': 300,
    'Mushroom (g)': 200,
    'Chillies (unit)': 3,
    'Beef stock (unit)': 2,
    Bovril: true,
    'Garlic (clove)': 2,
    'Onion (unit)': 1,
  },
  'Creamy mushroom soup': {
    'Mushroom (g)': 360,
    'Garlic (clove)': 3,
    'Onion (unit)': 2,
    'Single cream (ml)': 200,
    'Vegetable stock (unit)': 2,
  },
  'Lentil & bacon soup': {
    'Carrot (g)': 60,
    'Bacon (pack)': 1,
    'MSG (tsp)': 1,
    Pepper: true,
    'Chillies (unit)': 3,
    'Split red lentils (g)': 200,
    'Onion (unit)': 1,
    'Garlic (clove)': 3,
    'Chicken stock (unit)': 2,
    'Celery (stalk)': 1,
  },
  'Mushroom & chorizo soup': {
    'Garlic (clove)': 3,
    'Chorizo ring (unit)': 0.5,
    'Fresh basil (pack)': 1,
    'Mushroom (g)': 350,
    'Onion (unit)': 1,
    'Chicken stock (unit)': 2,
    'Chillies (unit)': 3,
    'MSG (tsp)': 1,
    Pepper: true,
  },
  'Red Pepper & chorizo soup': {
    'Chorizo ring (unit)': 0.5,
    'Onion (unit)': 1,
    'Garlic (clove)': 2,
    'Red pepper (unit)': 3,
    'Chillies (unit)': 3,
    'Chicken stock (unit)': 2,
  },
  'Roast vegetable soup': {
    'Red pepper (unit)': 2,
    'Courgette (unit)': 3,
    'Carrot (g)': 120,
    'Parsnip (g)': 160,
    'Tomato (unit)': 2,
    'Onion (unit)': 1,
    'Garlic (clove)': 10,
    'Vegetable stock (unit)': 2,
    Honey: true,
    'MSG (tsp)': 1,
    'Roasting herbs (pack)': 1,
  },
  'Seriously garlic chicken soup': {
    'Onion (unit)': 1,
    'Chicken (g)': 400,
    'Garlic (clove)': 40,
    'Lime (juice)': 1,
    'Chillies (unit)': 3,
    'Vegetable stock (unit)': 2,
    'MSG (tsp)': 1,
  },
  'Thai red chicken soup': {
    'Chicken (g)': 290,
    'Thai red curry paste (jar)': 1,
    'Lime (juice)': 1,
    'Lemongrass (stalk)': 1,
    'Chillies (unit)': 3,
    'Garlic (clove)': 2,
    'Galangal paste (g)': 90,
    'Spring onion (unit)': 4,
    'Chicken stock (unit)': 2,
  },
  'Tom Kha Chicken Soup': {
    'Chicken stock (unit)': 2,
    'Coconut milk (ml)': 350,
    'Chicken (g)': 450,
    'Lemongrass (stalk)': 1,
    'Galangal paste (g)': 90,
    'Kaffir lime leaves (unit)': 5,
    'Chillies (unit)': 4,
    'Fish sauce (ml)': 30,
    'Granulated sugar (ml)': 5,
    'Mushroom (g)': 150,
    'Lime (juice)': 1,
    'Spring onion (unit)': 1,
    'Red curry paste (g)': 50,
  },
  'Amaretto sour (serves 1)': {
    'Amaretto (ml)': 150,
    'Bourbon (ml)': 25,
    'Lemon juice (ml)': 27,
    'Simple syrup (tsp)': 1,
    'Egg white (ml)': 15,
  },
  'Aperol spritz (serves 1)': {
    'Prosecco (ml)': 210,
    'Aperol (ml)': 140,
    'Lemonade (ml)': 70,
  },
  'Godfather (serves 1)': {
    'Whiskey (ml)': 60,
    'Amaretto (ml)': 20,
    Bitters: true,
  },
  'Chicken & bacon pasta': {
    'Bacon (pack)': 1,
    'Chicken breast (unit)': 2,
    'Rocket (pack)': 1,
    'Mozzarella (ball)': 1,
    'Tortellini (pack)': 1,
  },
  'Simple chicken & mushroom pasta': {
    'Chicken breast (unit)': 2,
    'Chillies (unit)': 3,
    'Mushroom (g)': 200,
    'Pasta (g)': 200,
    'Mustard powder (tsp)': 0.5,
    'Double cream (ml)': 150,
    Butter: true,
    'MSG (tsp)': 0.5,
    'Onion (unit)': 1,
    Pepper: true,
    'Grated parmesan': true,
    'Cajun seasoning': true,
  },
};
