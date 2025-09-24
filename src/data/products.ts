import { Product } from '../types/Product';

export const products: Product[] = [
  {
    id: "tshirt-001",
    name: "Classic Double Cotton T-Shirt",
    description: "A comfortable and versatile cotton t-shirt perfect for everyday wear. Made from 100% organic cotton with a relaxed fit.",
    basePrice: 29.99,
    mainImage: "https://placehold.co/600x400/4a90e2/white?text=Classic+T-Shirt",
    dimensions: [
      {
        name: "size",
        options: [
          { name: "Small", value: "S" },
          { name: "Medium", value: "M" },
          { name: "Large", value: "L" },
          { name: "Extra Large", value: "XL" }
        ]
      },
      {
        name: "color",
        options: [
          { name: "Black", value: "black" },
          { name: "White", value: "white" },
          { name: "Navy Blue", value: "navy" },
          { name: "Forest Green", value: "green" }
        ]
      }
    ],
    variants: [
      {
        dimensionValues: { size: "S", color: "black" },
        image: "https://placehold.co/600x400/000000/white?text=S+Black",
        inStock: true
      },
      {
        dimensionValues: { size: "S", color: "white" },
        image: "https://placehold.co/600x400/ffffff/000000?text=S+White",
        inStock: true
      },
      {
        dimensionValues: { size: "M", color: "black" },
        image: "https://placehold.co/600x400/000000/white?text=M+Black",
        inStock: true
      },
      {
        dimensionValues: { size: "M", color: "white" },
        image: "https://placehold.co/600x400/ffffff/000000?text=M+White",
        inStock: true
      },
      {
        dimensionValues: { size: "M", color: "navy" },
        image: "https://placehold.co/600x400/001f3f/white?text=M+Navy",
        inStock: false
      },
      {
        dimensionValues: { size: "L", color: "black" },
        image: "https://placehold.co/600x400/000000/white?text=L+Black",
        inStock: true
      },
      {
        dimensionValues: { size: "L", color: "green" },
        image: "https://placehold.co/600x400/2d5016/white?text=L+Green",
        inStock: false
      },
      {
        dimensionValues: { size: "XL", color: "black" },
        image: "https://placehold.co/600x400/000000/white?text=XL+Black",
        price: 34.99,
        inStock: true
      }
    ],
    category: "apparel",
    tags: ["casual", "cotton", "basic"]
  },
  {
    id: "sneakers-001",
    name: "Urban Runner Sneakers",
    description: "Modern athletic sneakers designed for both performance and style. Features breathable mesh upper and comfortable cushioned sole.",
    basePrice: 89.99,
    mainImage: "https://placehold.co/600x400/ff6b35/white?text=Urban+Sneakers",
    dimensions: [
      {
        name: "size",
        options: [
          { name: "US 7", value: "7" },
          { name: "US 8", value: "8" },
          { name: "US 9", value: "9" },
          { name: "US 10", value: "10" },
          { name: "US 11", value: "11" }
        ]
      },
      {
        name: "color",
        options: [
          { name: "White/Blue", value: "white-blue" },
          { name: "Black/Red", value: "black-red" },
          { name: "Gray/Orange", value: "gray-orange" }
        ]
      }
    ],
    variants: [
      {
        dimensionValues: { size: "8", color: "white-blue" },
        image: "https://placehold.co/600x400/ffffff/4a90e2?text=Size+8+White+Blue",
        inStock: true
      },
      {
        dimensionValues: { size: "9", color: "white-blue" },
        image: "https://placehold.co/600x400/ffffff/4a90e2?text=Size+9+White+Blue",
        inStock: true
      },
      {
        dimensionValues: { size: "9", color: "black-red" },
        image: "https://placehold.co/600x400/000000/ff4136?text=Size+9+Black+Red",
        inStock: false
      },
      {
        dimensionValues: { size: "10", color: "black-red" },
        image: "https://placehold.co/600x400/000000/ff4136?text=Size+10+Black+Red",
        inStock: true
      },
      {
        dimensionValues: { size: "10", color: "gray-orange" },
        image: "https://placehold.co/600x400/aaaaaa/ff851b?text=Size+10+Gray+Orange",
        inStock: false
      }
    ],
    category: "footwear",
    tags: ["athletic", "casual", "comfortable"]
  },
  {
    id: "backpack-001",
    name: "Adventure Daypack",
    description: "Durable and spacious backpack perfect for daily commute or weekend adventures. Features multiple compartments and water-resistant material.",
    basePrice: 59.99,
    mainImage: "https://placehold.co/600x400/2ecc71/white?text=Adventure+Backpack",
    dimensions: [
      {
        name: "size",
        options: [
          { name: "25L", value: "25L" },
          { name: "35L", value: "35L" }
        ]
      },
      {
        name: "color",
        options: [
          { name: "Charcoal", value: "charcoal" },
          { name: "Forest Green", value: "forest" },
          { name: "Navy Blue", value: "navy" }
        ]
      }
    ],
    variants: [
      {
        dimensionValues: { size: "25L", color: "charcoal" },
        image: "https://placehold.co/600x400/36454f/white?text=25L+Charcoal",
        inStock: true
      },
      {
        dimensionValues: { size: "25L", color: "forest" },
        image: "https://placehold.co/600x400/2d5016/white?text=25L+Forest",
        inStock: true
      },
      {
        dimensionValues: { size: "35L", color: "charcoal" },
        image: "https://placehold.co/600x400/36454f/white?text=35L+Charcoal",
        price: 69.99,
        inStock: true
      },
      {
        dimensionValues: { size: "35L", color: "navy" },
        image: "https://placehold.co/600x400/001f3f/white?text=35L+Navy",
        price: 69.99,
        inStock: false
      }
    ],
    category: "accessories",
    tags: ["outdoor", "travel", "durable"]
  }
];
