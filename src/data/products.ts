import { Product } from '../types/Product';

export const products: Product[] = [
  {
    id: "sofa-001",
    name: "Modern L-Shaped Sectional Sofa",
    description: "Spacious L-shaped sectional sofa with premium fabric upholstery. Perfect for large living rooms. Includes ottoman and throw pillows.",
    basePrice: 1299.99,
    specialPrice: 999.99,
    mainImage: "/images/products/placeholder.svg",
    dimensions: [
      {
        name: "configuration",
        options: [
          { name: "Left Facing", value: "left" },
          { name: "Right Facing", value: "right" }
        ]
      },
      {
        name: "color",
        options: [
          { name: "Charcoal Gray", value: "charcoal" },
          { name: "Navy Blue", value: "navy" },
          { name: "Beige", value: "beige" },
          { name: "Forest Green", value: "green" }
        ]
      }
    ],
    variants: [
      {
        dimensionValues: { configuration: "left", color: "charcoal" },
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600",
        inStock: true
      },
      {
        dimensionValues: { configuration: "left", color: "navy" },
        image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600",
        inStock: true
      },
      {
        dimensionValues: { configuration: "right", color: "beige" },
        image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600",
        inStock: true
      },
      {
        dimensionValues: { configuration: "right", color: "green" },
        image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600",
        inStock: false
      }
    ],
    category: "living-room",
    tags: ["sectional", "modern", "comfortable"]
  },
  {
    id: "dining-table-001",
    name: "Solid Wood Dining Table",
    description: "Beautiful solid oak dining table with natural finish. Seats 6-8 people comfortably. Sturdy construction with classic design.",
    basePrice: 899.99,
    specialPrice: 699.99,
    mainImage: "https://images.unsplash.com/photo-1549497538-303791108f95?w=600",
    dimensions: [
      {
        name: "size",
        options: [
          { name: "6 Seater", value: "6" },
          { name: "8 Seater", value: "8" }
        ]
      },
      {
        name: "finish",
        options: [
          { name: "Natural Oak", value: "natural" },
          { name: "Dark Walnut", value: "walnut" },
          { name: "White Wash", value: "white" }
        ]
      }
    ],
    variants: [
      {
        dimensionValues: { size: "6", finish: "natural" },
        image: "https://images.unsplash.com/photo-1549497538-303791108f95?w=600",
        inStock: true
      },
      {
        dimensionValues: { size: "6", finish: "walnut" },
        image: "https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=600",
        inStock: true
      },
      {
        dimensionValues: { size: "8", finish: "natural" },
        image: "https://images.unsplash.com/photo-1565791380713-1756b9a05343?w=600",
        price: 1099.99,
        inStock: true
      },
      {
        dimensionValues: { size: "8", finish: "white" },
        image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600",
        price: 1099.99,
        inStock: false
      }
    ],
    category: "dining",
    tags: ["wood", "dining", "traditional"]
  },
  {
    id: "office-chair-001",
    name: "Ergonomic Office Chair",
    description: "High-back ergonomic office chair with lumbar support. Adjustable height, armrests, and tilt mechanism for maximum comfort.",
    basePrice: 349.99,
    specialPrice: 249.99,
    mainImage: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600",
    dimensions: [
      {
        name: "material",
        options: [
          { name: "Mesh Back", value: "mesh" },
          { name: "Leather", value: "leather" }
        ]
      },
      {
        name: "color",
        options: [
          { name: "Black", value: "black" },
          { name: "Gray", value: "gray" },
          { name: "White", value: "white" }
        ]
      }
    ],
    variants: [
      {
        dimensionValues: { material: "mesh", color: "black" },
        image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600",
        inStock: true
      },
      {
        dimensionValues: { material: "mesh", color: "gray" },
        image: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600",
        inStock: true
      },
      {
        dimensionValues: { material: "leather", color: "black" },
        image: "https://images.unsplash.com/photo-1541558869434-2840d308329a?w=600",
        price: 449.99,
        inStock: true
      },
      {
        dimensionValues: { material: "leather", color: "white" },
        image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600",
        price: 449.99,
        inStock: false
      }
    ],
    category: "office",
    tags: ["ergonomic", "adjustable", "comfortable"]
  },
  {
    id: "bed-frame-001",
    name: "Platform Bed Frame with Headboard",
    description: "Modern platform bed frame with upholstered headboard. No box spring needed. Includes slat support system.",
    basePrice: 799.99,
    specialPrice: 599.99,
    mainImage: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600",
    dimensions: [
      {
        name: "size",
        options: [
          { name: "Queen", value: "queen" },
          { name: "King", value: "king" },
          { name: "California King", value: "cal-king" }
        ]
      },
      {
        name: "color",
        options: [
          { name: "Gray Linen", value: "gray" },
          { name: "Navy Velvet", value: "navy" },
          { name: "Beige Linen", value: "beige" }
        ]
      }
    ],
    variants: [
      {
        dimensionValues: { size: "queen", color: "gray" },
        image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600",
        inStock: true
      },
      {
        dimensionValues: { size: "queen", color: "navy" },
        image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600",
        inStock: true
      },
      {
        dimensionValues: { size: "king", color: "gray" },
        image: "https://images.unsplash.com/photo-1522444024501-4c17d26eff47?w=600",
        price: 999.99,
        inStock: true
      },
      {
        dimensionValues: { size: "cal-king", color: "beige" },
        image: "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600",
        price: 1099.99,
        inStock: false
      }
    ],
    category: "bedroom",
    tags: ["modern", "upholstered", "platform"]
  },
  {
    id: "bookshelf-001",
    name: "5-Tier Industrial Bookshelf",
    description: "Industrial-style bookshelf with metal frame and wood shelves. Perfect for books, decor, and storage. Anti-tip hardware included.",
    basePrice: 299.99,
    mainImage: "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=600",
    dimensions: [
      {
        name: "width",
        options: [
          { name: "31 inches", value: "31" },
          { name: "47 inches", value: "47" }
        ]
      },
      {
        name: "finish",
        options: [
          { name: "Rustic Brown", value: "rustic" },
          { name: "Black Oak", value: "black-oak" },
          { name: "White", value: "white" }
        ]
      }
    ],
    variants: [
      {
        dimensionValues: { width: "31", finish: "rustic" },
        image: "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=600",
        inStock: true
      },
      {
        dimensionValues: { width: "31", finish: "black-oak" },
        image: "https://images.unsplash.com/photo-1606387164815-3304b3aadab7?w=600",
        inStock: true
      },
      {
        dimensionValues: { width: "47", finish: "rustic" },
        image: "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=600",
        price: 399.99,
        inStock: true
      },
      {
        dimensionValues: { width: "47", finish: "white" },
        image: "https://images.unsplash.com/photo-1568649929103-28ffbefaca1e?w=600",
        price: 399.99,
        inStock: false
      }
    ],
    category: "storage",
    tags: ["industrial", "shelving", "storage"]
  },
  {
    id: "dresser-001",
    name: "6-Drawer Double Dresser",
    description: "Spacious 6-drawer dresser with smooth gliding drawers. Solid wood construction with elegant hardware. Anti-tip safety feature.",
    basePrice: 599.99,
    mainImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
    dimensions: [
      {
        name: "style",
        options: [
          { name: "Modern", value: "modern" },
          { name: "Traditional", value: "traditional" }
        ]
      },
      {
        name: "color",
        options: [
          { name: "White", value: "white" },
          { name: "Espresso", value: "espresso" },
          { name: "Natural Wood", value: "natural" }
        ]
      }
    ],
    variants: [
      {
        dimensionValues: { style: "modern", color: "white" },
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
        inStock: true
      },
      {
        dimensionValues: { style: "modern", color: "espresso" },
        image: "https://images.unsplash.com/photo-1633505898198-bb989ec2dca5?w=600",
        inStock: true
      },
      {
        dimensionValues: { style: "traditional", color: "natural" },
        image: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600",
        price: 699.99,
        inStock: true
      }
    ],
    category: "bedroom",
    tags: ["storage", "drawer", "wood"]
  },
  {
    id: "coffee-table-001",
    name: "Glass Top Coffee Table",
    description: "Modern coffee table with tempered glass top and sleek metal legs. Features lower shelf for storage. Easy to clean and maintain.",
    basePrice: 399.99,
    specialPrice: 299.99,
    mainImage: "https://images.unsplash.com/photo-1565374395542-0ce18882c857?w=600",
    dimensions: [
      {
        name: "shape",
        options: [
          { name: "Rectangular", value: "rectangular" },
          { name: "Round", value: "round" }
        ]
      },
      {
        name: "frame",
        options: [
          { name: "Chrome", value: "chrome" },
          { name: "Black Metal", value: "black" },
          { name: "Gold", value: "gold" }
        ]
      }
    ],
    variants: [
      {
        dimensionValues: { shape: "rectangular", frame: "chrome" },
        image: "https://images.unsplash.com/photo-1565374395542-0ce18882c857?w=600",
        inStock: true
      },
      {
        dimensionValues: { shape: "rectangular", frame: "black" },
        image: "https://images.unsplash.com/photo-1619911013027-8e10291d7026?w=600",
        inStock: true
      },
      {
        dimensionValues: { shape: "round", frame: "gold" },
        image: "https://images.unsplash.com/photo-1558211583-d26475e88199?w=600",
        price: 449.99,
        inStock: false
      }
    ],
    category: "living-room",
    tags: ["modern", "glass", "minimalist"]
  },
  {
    id: "nightstand-001",
    name: "Bedside Nightstand with Drawers",
    description: "Compact nightstand with 2 drawers and open shelf. Perfect size for bedside essentials. USB charging ports included.",
    basePrice: 149.99,
    mainImage: "https://images.unsplash.com/photo-1616627577385-88577cea3c51?w=600",
    dimensions: [
      {
        name: "style",
        options: [
          { name: "Modern", value: "modern" },
          { name: "Rustic", value: "rustic" }
        ]
      },
      {
        name: "color",
        options: [
          { name: "White", value: "white" },
          { name: "Walnut", value: "walnut" },
          { name: "Gray", value: "gray" }
        ]
      }
    ],
    variants: [
      {
        dimensionValues: { style: "modern", color: "white" },
        image: "https://images.unsplash.com/photo-1616627577385-88577cea3c51?w=600",
        inStock: true
      },
      {
        dimensionValues: { style: "modern", color: "gray" },
        image: "https://images.unsplash.com/photo-1630585308572-542f7c5dbe66?w=600",
        inStock: true
      },
      {
        dimensionValues: { style: "rustic", color: "walnut" },
        image: "https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=600",
        price: 179.99,
        inStock: true
      }
    ],
    category: "bedroom",
    tags: ["storage", "compact", "functional"]
  },
  {
    id: "recliner-001",
    name: "Power Reclining Chair",
    description: "Electric power recliner with USB charging port. Premium leather upholstery with memory foam padding. Smooth and quiet recline mechanism.",
    basePrice: 799.99,
    mainImage: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600",
    dimensions: [
      {
        name: "type",
        options: [
          { name: "Manual", value: "manual" },
          { name: "Power", value: "power" }
        ]
      },
      {
        name: "color",
        options: [
          { name: "Brown Leather", value: "brown" },
          { name: "Black Leather", value: "black" },
          { name: "Gray Fabric", value: "gray" }
        ]
      }
    ],
    variants: [
      {
        dimensionValues: { type: "manual", color: "brown" },
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600",
        price: 599.99,
        inStock: true
      },
      {
        dimensionValues: { type: "power", color: "black" },
        image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600",
        inStock: true
      },
      {
        dimensionValues: { type: "power", color: "gray" },
        image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600",
        inStock: false
      }
    ],
    category: "living-room",
    tags: ["recliner", "comfort", "leather"]
  },
  {
    id: "bar-stool-001",
    name: "Adjustable Bar Stool Set",
    description: "Set of 2 adjustable height bar stools with 360-degree swivel. Comfortable cushioned seats with footrest. Perfect for kitchen islands.",
    basePrice: 199.99,
    mainImage: "https://images.unsplash.com/photo-1549497538-303791108f95?w=600",
    dimensions: [
      {
        name: "height",
        options: [
          { name: "Counter Height", value: "counter" },
          { name: "Bar Height", value: "bar" }
        ]
      },
      {
        name: "color",
        options: [
          { name: "Black", value: "black" },
          { name: "White", value: "white" },
          { name: "Brown", value: "brown" }
        ]
      }
    ],
    variants: [
      {
        dimensionValues: { height: "counter", color: "black" },
        image: "https://images.unsplash.com/photo-1549497538-303791108f95?w=600",
        inStock: true
      },
      {
        dimensionValues: { height: "bar", color: "white" },
        image: "https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=600",
        inStock: true
      },
      {
        dimensionValues: { height: "bar", color: "brown" },
        image: "https://images.unsplash.com/photo-1565791380713-1756b9a05343?w=600",
        inStock: false
      }
    ],
    category: "dining",
    tags: ["seating", "adjustable", "modern"]
  },
  {
    id: "wardrobe-001",
    name: "3-Door Wardrobe with Mirror",
    description: "Spacious 3-door wardrobe with built-in full-length mirror. Multiple compartments, hanging rods, and adjustable shelves.",
    basePrice: 899.99,
    mainImage: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600",
    dimensions: [
      {
        name: "width",
        options: [
          { name: "47 inches", value: "47" },
          { name: "59 inches", value: "59" }
        ]
      },
      {
        name: "finish",
        options: [
          { name: "White", value: "white" },
          { name: "Oak", value: "oak" },
          { name: "Walnut", value: "walnut" }
        ]
      }
    ],
    variants: [
      {
        dimensionValues: { width: "47", finish: "white" },
        image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600",
        inStock: true
      },
      {
        dimensionValues: { width: "47", finish: "oak" },
        image: "https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=600",
        inStock: true
      },
      {
        dimensionValues: { width: "59", finish: "walnut" },
        image: "https://images.unsplash.com/photo-1633505650701-6104c4fc72c2?w=600",
        price: 1099.99,
        inStock: true
      }
    ],
    category: "bedroom",
    tags: ["storage", "wardrobe", "mirror"]
  },
  {
    id: "tv-stand-001",
    name: "Entertainment Center TV Stand",
    description: "Modern TV stand with cable management system. Accommodates TVs up to 65 inches. Features open shelving and closed storage.",
    basePrice: 449.99,
    specialPrice: 349.99,
    mainImage: "https://images.unsplash.com/photo-1621955964441-c173e01c135b?w=600",
    dimensions: [
      {
        name: "size",
        options: [
          { name: "For 55\" TV", value: "55" },
          { name: "For 65\" TV", value: "65" }
        ]
      },
      {
        name: "color",
        options: [
          { name: "Black Wood", value: "black" },
          { name: "White", value: "white" },
          { name: "Natural Wood", value: "natural" }
        ]
      }
    ],
    variants: [
      {
        dimensionValues: { size: "55", color: "black" },
        image: "https://images.unsplash.com/photo-1621955964441-c173e01c135b?w=600",
        inStock: true
      },
      {
        dimensionValues: { size: "55", color: "white" },
        image: "https://images.unsplash.com/photo-1589834390005-5d4fb9bf3d32?w=600",
        inStock: true
      },
      {
        dimensionValues: { size: "65", color: "natural" },
        image: "https://images.unsplash.com/photo-1571415060716-baab5e4ebe74?w=600",
        price: 549.99,
        inStock: false
      }
    ],
    category: "living-room",
    tags: ["entertainment", "storage", "modern"]
  },
  {
    id: "ottoman-001",
    name: "Storage Ottoman Bench",
    description: "Multifunctional ottoman with hidden storage compartment. Can be used as seating, footrest, or coffee table. Durable upholstery.",
    basePrice: 179.99,
    mainImage: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600",
    dimensions: [
      {
        name: "shape",
        options: [
          { name: "Rectangle", value: "rectangle" },
          { name: "Square", value: "square" }
        ]
      },
      {
        name: "color",
        options: [
          { name: "Gray", value: "gray" },
          { name: "Navy", value: "navy" },
          { name: "Beige", value: "beige" }
        ]
      }
    ],
    variants: [
      {
        dimensionValues: { shape: "rectangle", color: "gray" },
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600",
        inStock: true
      },
      {
        dimensionValues: { shape: "square", color: "navy" },
        image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600",
        inStock: true
      },
      {
        dimensionValues: { shape: "square", color: "beige" },
        image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600",
        inStock: false
      }
    ],
    category: "living-room",
    tags: ["storage", "versatile", "seating"]
  },
  {
    id: "desk-001",
    name: "L-Shaped Computer Desk",
    description: "Spacious L-shaped desk perfect for home office or gaming setup. Built-in cable management and sturdy steel frame.",
    basePrice: 399.99,
    specialPrice: 319.99,
    mainImage: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600",
    dimensions: [
      {
        name: "orientation",
        options: [
          { name: "Left Return", value: "left" },
          { name: "Right Return", value: "right" }
        ]
      },
      {
        name: "color",
        options: [
          { name: "Black", value: "black" },
          { name: "White", value: "white" },
          { name: "Rustic Brown", value: "rustic" }
        ]
      }
    ],
    variants: [
      {
        dimensionValues: { orientation: "left", color: "black" },
        image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600",
        inStock: true
      },
      {
        dimensionValues: { orientation: "right", color: "white" },
        image: "https://images.unsplash.com/photo-1587302525600-b859e282491f?w=600",
        inStock: true
      },
      {
        dimensionValues: { orientation: "right", color: "rustic" },
        image: "https://images.unsplash.com/photo-1486946255434-2466348c2166?w=600",
        inStock: false
      }
    ],
    category: "office",
    tags: ["desk", "L-shaped", "workspace"]
  },
  {
    id: "filing-cabinet-001",
    name: "4-Drawer Filing Cabinet",
    description: "Lockable 4-drawer filing cabinet for letter and legal size files. Anti-tip mechanism and smooth drawer slides.",
    basePrice: 249.99,
    mainImage: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=600",
    dimensions: [
      {
        name: "drawers",
        options: [
          { name: "2 Drawers", value: "2" },
          { name: "4 Drawers", value: "4" }
        ]
      },
      {
        name: "color",
        options: [
          { name: "Black", value: "black" },
          { name: "Gray", value: "gray" },
          { name: "White", value: "white" }
        ]
      }
    ],
    variants: [
      {
        dimensionValues: { drawers: "2", color: "black" },
        image: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=600",
        price: 149.99,
        inStock: true
      },
      {
        dimensionValues: { drawers: "4", color: "gray" },
        image: "https://images.unsplash.com/photo-1597392627403-4c6ae71688b1?w=600",
        inStock: true
      },
      {
        dimensionValues: { drawers: "4", color: "white" },
        image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600",
        inStock: false
      }
    ],
    category: "office",
    tags: ["storage", "filing", "organization"]
      },
      {
    id: "accent-chair-001",
    name: "Mid-Century Accent Chair",
    description: "Stylish mid-century modern accent chair with wooden legs. Perfect for reading corners or as additional seating.",
    basePrice: 299.99,
    mainImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600",
    dimensions: [
      {
        name: "style",
        options: [
          { name: "Wingback", value: "wingback" },
          { name: "Club Chair", value: "club" }
        ]
      },
      {
        name: "color",
        options: [
          { name: "Mustard Yellow", value: "mustard" },
          { name: "Teal", value: "teal" },
          { name: "Gray", value: "gray" }
        ]
      }
    ],
    variants: [
      {
        dimensionValues: { style: "wingback", color: "mustard" },
        image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600",
        inStock: true
      },
      {
        dimensionValues: { style: "club", color: "teal" },
        image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600",
        inStock: true
      },
      {
        dimensionValues: { style: "club", color: "gray" },
        image: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600",
        inStock: false
      }
    ],
    category: "living-room",
    tags: ["accent", "modern", "comfortable"]
  },
  {
    id: "console-table-001",
    name: "Narrow Console Table",
    description: "Slim console table perfect for entryways or behind sofas. Features two drawers and lower shelf for storage.",
    basePrice: 229.99,
    mainImage: "https://images.unsplash.com/photo-1565374395542-0ce18882c857?w=600",
    dimensions: [
      {
        name: "width",
        options: [
          { name: "36 inches", value: "36" },
          { name: "48 inches", value: "48" }
        ]
      },
      {
        name: "finish",
        options: [
          { name: "White", value: "white" },
          { name: "Walnut", value: "walnut" },
          { name: "Black", value: "black" }
        ]
      }
    ],
    variants: [
      {
        dimensionValues: { width: "36", finish: "white" },
        image: "https://images.unsplash.com/photo-1565374395542-0ce18882c857?w=600",
        inStock: true
      },
      {
        dimensionValues: { width: "48", finish: "walnut" },
        image: "https://images.unsplash.com/photo-1558211583-d26475e88199?w=600",
        price: 279.99,
        inStock: true
      },
      {
        dimensionValues: { width: "48", finish: "black" },
        image: "https://images.unsplash.com/photo-1619911013027-8e10291d7026?w=600",
        price: 279.99,
        inStock: false
      }
    ],
    category: "living-room",
    tags: ["console", "storage", "entryway"]
  },
  {
    id: "vanity-001",
    name: "Makeup Vanity with Mirror",
    description: "Elegant vanity table with Hollywood-style LED mirror. Multiple drawers for cosmetics storage. Cushioned stool included.",
    basePrice: 449.99,
    mainImage: "https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=600",
    dimensions: [
      {
        name: "size",
        options: [
          { name: "Compact", value: "compact" },
          { name: "Full Size", value: "full" }
        ]
      },
      {
        name: "color",
        options: [
          { name: "White", value: "white" },
          { name: "Pink", value: "pink" },
          { name: "Black", value: "black" }
        ]
      }
    ],
    variants: [
      {
        dimensionValues: { size: "compact", color: "white" },
        image: "https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=600",
        inStock: true
      },
      {
        dimensionValues: { size: "full", color: "pink" },
        image: "https://images.unsplash.com/photo-1616627577385-88577cea3c51?w=600",
        price: 549.99,
        inStock: true
      },
      {
        dimensionValues: { size: "full", color: "black" },
        image: "https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=600",
        price: 549.99,
        inStock: false
      }
    ],
    category: "bedroom",
    tags: ["vanity", "makeup", "mirror"]
  },
  {
    id: "bench-001",
    name: "Upholstered Storage Bench",
    description: "Elegant upholstered bench with button tufting. Hidden storage compartment under the seat. Perfect for bedroom or entryway.",
    basePrice: 189.99,
    mainImage: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600",
    dimensions: [
      {
        name: "length",
        options: [
          { name: "42 inches", value: "42" },
          { name: "52 inches", value: "52" }
        ]
      },
      {
        name: "fabric",
        options: [
          { name: "Velvet Gray", value: "velvet-gray" },
          { name: "Linen Beige", value: "linen-beige" },
          { name: "Leather Brown", value: "leather-brown" }
        ]
      }
    ],
    variants: [
      {
        dimensionValues: { length: "42", fabric: "velvet-gray" },
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600",
        inStock: true
      },
      {
        dimensionValues: { length: "52", fabric: "linen-beige" },
        image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600",
        price: 229.99,
        inStock: true
      },
      {
        dimensionValues: { length: "52", fabric: "leather-brown" },
        image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600",
        price: 299.99,
        inStock: false
      }
    ],
    category: "bedroom",
    tags: ["bench", "storage", "upholstered"]
  },
  {
    id: "side-table-001",
    name: "Round Side Table",
    description: "Minimalist round side table with metal legs. Perfect as an end table or plant stand. Compact design for small spaces.",
    basePrice: 89.99,
    mainImage: "https://images.unsplash.com/photo-1565374395542-0ce18882c857?w=600",
    dimensions: [
      {
        name: "diameter",
        options: [
          { name: "16 inches", value: "16" },
          { name: "20 inches", value: "20" }
        ]
      },
      {
        name: "top",
        options: [
          { name: "Wood", value: "wood" },
          { name: "Marble", value: "marble" },
          { name: "Glass", value: "glass" }
        ]
      }
    ],
    variants: [
      {
        dimensionValues: { diameter: "16", top: "wood" },
        image: "https://images.unsplash.com/photo-1565374395542-0ce18882c857?w=600",
        inStock: true
      },
      {
        dimensionValues: { diameter: "20", top: "marble" },
        image: "https://images.unsplash.com/photo-1558211583-d26475e88199?w=600",
        price: 139.99,
        inStock: true
      },
      {
        dimensionValues: { diameter: "20", top: "glass" },
        image: "https://images.unsplash.com/photo-1619911013027-8e10291d7026?w=600",
        price: 119.99,
        inStock: false
      }
    ],
    category: "living-room",
    tags: ["side-table", "minimalist", "compact"]
  },
  {
    id: "futon-001",
    name: "Convertible Futon Sofa Bed",
    description: "Modern futon that easily converts from sofa to bed. Memory foam mattress for comfort. Perfect for small spaces or guest rooms.",
    basePrice: 499.99,
    mainImage: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600",
    dimensions: [
      {
        name: "size",
        options: [
          { name: "Twin", value: "twin" },
          { name: "Full", value: "full" }
        ]
      },
      {
        name: "color",
        options: [
          { name: "Gray", value: "gray" },
          { name: "Navy", value: "navy" },
          { name: "Black", value: "black" }
        ]
      }
    ],
    variants: [
      {
        dimensionValues: { size: "twin", color: "gray" },
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600",
        inStock: true
      },
      {
        dimensionValues: { size: "full", color: "navy" },
        image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600",
        price: 599.99,
        inStock: true
      },
      {
        dimensionValues: { size: "full", color: "black" },
        image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600",
        price: 599.99,
        inStock: false
      }
    ],
    category: "living-room",
    tags: ["futon", "convertible", "space-saving"]
  },
  {
    id: "mirror-001",
    name: "Full Length Floor Mirror",
    description: "Large standing floor mirror with decorative frame. Can be leaned against wall or mounted. Perfect for bedrooms or dressing areas.",
    basePrice: 179.99,
    mainImage: "https://images.unsplash.com/photo-1565374395542-0ce18882c857?w=600",
    dimensions: [
      {
        name: "size",
        options: [
          { name: "65\" x 22\"", value: "65x22" },
          { name: "71\" x 30\"", value: "71x30" }
        ]
      },
      {
        name: "frame",
        options: [
          { name: "Gold", value: "gold" },
          { name: "Silver", value: "silver" },
          { name: "Wood", value: "wood" }
        ]
      }
    ],
    variants: [
      {
        dimensionValues: { size: "65x22", frame: "gold" },
        image: "https://images.unsplash.com/photo-1565374395542-0ce18882c857?w=600",
        inStock: true
      },
      {
        dimensionValues: { size: "71x30", frame: "silver" },
        image: "https://images.unsplash.com/photo-1558211583-d26475e88199?w=600",
        price: 229.99,
        inStock: true
      },
      {
        dimensionValues: { size: "71x30", frame: "wood" },
        image: "https://images.unsplash.com/photo-1619911013027-8e10291d7026?w=600",
        price: 249.99,
        inStock: false
      }
    ],
    category: "bedroom",
    tags: ["mirror", "floor-mirror", "decorative"]
  }
];