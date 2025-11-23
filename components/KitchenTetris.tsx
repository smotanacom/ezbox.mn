'use client';

import { useEffect, useState, useRef } from 'react';
import { getProducts } from '@/lib/api';
import type { Product } from '@/types/database';

interface Block {
  id: number;
  type: 'cabinet' | 'drawer' | 'counter' | 'shelf';
  color: string;
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
  { type: 'cabinet' as const, color: 'bg-primary/20', width: 240, height: 300 },
  { type: 'drawer' as const, color: 'bg-secondary/20', width: 300, height: 180 },
  { type: 'counter' as const, color: 'bg-primary/30', width: 360, height: 150 },
  { type: 'shelf' as const, color: 'bg-secondary/30', width: 270, height: 210 },
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

        console.log('Container dimensions:', { width, height });

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

    console.log('Initializing blocks with dimensions:', { containerWidth, containerHeight });

    // Adjust number of paths based on screen width
    const numPaths = containerWidth < 640 ? 2 : containerWidth < 1024 ? 3 : 5;

    // Spawn multiple initial blocks across the width
    const initialBlocks: Block[] = [];
    for (let i = 0; i < numPaths; i++) {
      const blockType = blockTypes[Math.floor(Math.random() * blockTypes.length)];
      const product = getRandomProduct();
      const maxX = Math.max(0, containerWidth - blockType.width);
      const x = Math.floor(Math.random() * maxX);
      const targetY = Math.max(0, containerHeight - blockType.height);
      console.log(`Creating initial block ${i}:`, { blockType: blockType.type, x, targetY, containerHeight });
      initialBlocks.push({
        id: nextIdRef.current++,
        ...blockType,
        productId: product.id,
        productName: product.name,
        productImage: product.picture_url,
        x: x,
        y: -blockType.height - Math.random() * 300 - 100, // Spawn higher above
        targetY: targetY,
      });
    }
    setBlocks(initialBlocks);
    console.log('Initial blocks created:', initialBlocks.length);

    // Add a new block every 0.6 seconds (2.5x more frequent)
    const addBlockInterval = setInterval(() => {
      setBlocks(currentBlocks => {
        // Filter to only settled blocks (blocks that have reached their target position)
        const settledBlocks = currentBlocks.filter(block =>
          Math.abs(block.y - block.targetY) < 5
        );

        console.log(`Spawn check: ${currentBlocks.length} total blocks, ${settledBlocks.length} settled`);

        // Check if the container is getting full based on settled blocks' actual positions
        if (settledBlocks.length > 0) {
          const topMostSettledY = settledBlocks.reduce((min, block) =>
            Math.min(min, block.y), containerHeight);

          console.log(`Top settled block Y: ${topMostSettledY}, threshold: ${containerHeight * 0.05}`);

          // Stop spawning if settled blocks have filled up to 5% of the container height
          if (topMostSettledY < containerHeight * 0.05) {
            console.log('Container full, stopping spawn');
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
          console.log('Target Y would be negative, skipping spawn');
          return currentBlocks;
        }

        console.log(`Spawning new block: type=${blockType.type}, x=${randomX}, targetY=${targetY}`);

        const newBlock: Block = {
          id: nextIdRef.current++,
          ...blockType,
          productId: product.id,
          productName: product.name,
          productImage: product.picture_url,
          x: randomX,
          y: -blockType.height - Math.random() * 300 - 100, // Spawn higher above
          targetY: targetY,
        };

        return [...currentBlocks, newBlock];
      });
    }, 600);

    // Animate blocks falling
    const animationInterval = setInterval(() => {
      setBlocks(currentBlocks =>
        currentBlocks.map(block => {
          if (block.y < block.targetY) {
            // Move block down by 6px per frame, but don't exceed targetY
            const newY = Math.min(block.y + 6, block.targetY);
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
            className={`absolute rounded-lg shadow-md border border-white/20 overflow-hidden backdrop-blur-sm relative`}
            style={{
              left: `${block.x}px`,
              top: `${block.y}px`,
              width: `${block.width}px`,
              height: `${block.height}px`,
            }}
          >
            <img
              src={block.productImage || `https://picsum.photos/seed/product${block.productId}/200/200`}
              alt={block.productName}
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-center p-2">
              <span className="text-xs font-semibold text-white text-center drop-shadow-lg line-clamp-2">
                {block.productName}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
