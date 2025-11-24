'use client';

import { useEffect, useState, useRef } from 'react';
import { getProducts } from '@/lib/api';
import type { Product } from '@/types/database';

interface Block {
  id: number;
  type: 'cabinet' | 'drawer' | 'counter' | 'shelf';
  gradient: string;
  width: number;
  height: number;
  x: number;
  y: number;
  targetY: number;
  productId: number;
  productName: string;
  productImage: string | null;
}

const blockTypes = [
  {
    type: 'cabinet' as const,
    width: 120,
    height: 120,
    gradient: 'from-blue-400/30 to-blue-600/20'
  },
  {
    type: 'drawer' as const,
    width: 150,
    height: 90,
    gradient: 'from-purple-400/30 to-purple-600/20'
  },
  {
    type: 'counter' as const,
    width: 180,
    height: 80,
    gradient: 'from-indigo-400/30 to-indigo-600/20'
  },
  {
    type: 'shelf' as const,
    width: 140,
    height: 100,
    gradient: 'from-violet-400/30 to-violet-600/20'
  },
];

export default function KitchenTetris() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [containerHeight, setContainerHeight] = useState(600);
  const nextIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch products on mount
  useEffect(() => {
    async function loadProducts() {
      try {
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
    }
    loadProducts();
  }, []);

  // Helper function to get a random product
  const getRandomProduct = () => {
    if (products.length === 0) {
      return {
        id: 0,
        name: 'Product',
        picture_url: null,
      };
    }
    return products[Math.floor(Math.random() * products.length)];
  };

  // Update container dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        // Ensure we have valid dimensions
        if (width > 0) setContainerWidth(width);
        if (height > 0) setContainerHeight(height);
      }
    };

    // Initial update
    updateDimensions();

    // Wait for parent to render fully and update multiple times to ensure proper height
    setTimeout(updateDimensions, 100);
    setTimeout(updateDimensions, 300);
    setTimeout(updateDimensions, 500);

    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    // Wait for products to load before creating blocks
    if (products.length === 0) return;

    // Adjust number of initial blocks based on screen width
    const numInitial = containerWidth < 640 ? 3 : containerWidth < 1024 ? 5 : 8;

    // Spawn multiple initial blocks across the width
    const initialBlocks: Block[] = [];
    for (let i = 0; i < numInitial; i++) {
      const blockType = blockTypes[Math.floor(Math.random() * blockTypes.length)];
      const product = getRandomProduct();
      const maxX = Math.max(0, containerWidth - blockType.width);
      const x = Math.floor(Math.random() * maxX);
      const targetY = Math.max(0, containerHeight - blockType.height);
      initialBlocks.push({
        id: nextIdRef.current++,
        ...blockType,
        productId: product.id,
        productName: product.name,
        productImage: product.picture_url,
        x: x,
        y: -blockType.height - Math.random() * 400 - 100, // Spawn higher above
        targetY: targetY,
      });
    }
    setBlocks(initialBlocks);

    // Add a new block every 0.4 seconds (faster with smaller blocks)
    const addBlockInterval = setInterval(() => {
      setBlocks(currentBlocks => {
        // Filter to only settled blocks (blocks that have reached their target position)
        const settledBlocks = currentBlocks.filter(block =>
          Math.abs(block.y - block.targetY) < 5
        );

        // Check if the container is getting full based on settled blocks' actual positions
        if (settledBlocks.length > 0) {
          const topMostSettledY = settledBlocks.reduce((min, block) =>
            Math.min(min, block.y), containerHeight);

          // Stop spawning if settled blocks have filled up to 2% of the container height (nearly full)
          if (topMostSettledY < containerHeight * 0.02) {
            return currentBlocks;
          }
        }

        const blockType = blockTypes[Math.floor(Math.random() * blockTypes.length)];
        const product = getRandomProduct();
        const maxX = Math.max(0, containerWidth - blockType.width);
        const randomX = Math.floor(Math.random() * maxX);

        // Calculate target Y based on existing SETTLED blocks only
        let targetY = Math.max(0, containerHeight - blockType.height); // Start at bottom

        // Check for collisions with existing settled blocks
        for (const block of settledBlocks) {
          const xOverlap = randomX < block.x + block.width && randomX + blockType.width > block.x;
          if (xOverlap) {
            // Stack on top of the settled block using its actual Y position
            const potentialY = block.y - blockType.height;
            if (potentialY < targetY) {
              targetY = potentialY;
            }
          }
        }

        // Don't spawn if target position would be above container
        if (targetY < 0) {
          return currentBlocks;
        }

        const newBlock: Block = {
          id: nextIdRef.current++,
          ...blockType,
          productId: product.id,
          productName: product.name,
          productImage: product.picture_url,
          x: randomX,
          y: -blockType.height - Math.random() * 400 - 100, // Spawn higher above
          targetY: targetY,
        };

        return [...currentBlocks, newBlock];
      });
    }, 400);

    // Animate blocks falling
    const animationInterval = setInterval(() => {
      setBlocks(currentBlocks =>
        currentBlocks.map(block => {
          if (block.y < block.targetY) {
            // Move block down by 4px per frame (slightly slower for better visual effect)
            const newY = Math.min(block.y + 4, block.targetY);
            return { ...block, y: newY };
          }
          return block;
        })
      );
    }, 30);

    return () => {
      clearInterval(addBlockInterval);
      clearInterval(animationInterval);
    };
  }, [containerWidth, containerHeight, products]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Blocks */}
      <div className="relative w-full h-full">
        {blocks.map(block => (
          <div
            key={block.id}
            className={`absolute rounded-lg shadow-lg border border-white/30 overflow-hidden backdrop-blur-sm bg-gradient-to-br ${block.gradient}`}
            style={{
              left: `${block.x}px`,
              top: `${block.y}px`,
              width: `${block.width}px`,
              height: `${block.height}px`,
            }}
          >
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10"></div>

            {/* Product name */}
            <div className="absolute inset-0 flex items-center justify-center p-2">
              <span className="text-xs font-bold text-white text-center drop-shadow-lg line-clamp-3">
                {block.productName}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
