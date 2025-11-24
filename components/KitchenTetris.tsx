'use client';

import { useEffect, useState, useRef } from 'react';
import { getAllProductsWithDetails } from '@/lib/api';
import { getFirstImageUrl } from '@/lib/storage-client';
import type { ProductWithDetails } from '@/types/database';

// Grid configuration
const CELL_SIZE = 60; // pixels per grid cell
// GRID_COLS and GRID_ROWS will be calculated based on container dimensions

// Tetris shape definitions (in grid units)
interface TetrisShape {
  type: 'I' | 'O' | 'T' | 'L' | 'J' | 'S' | 'Z';
  cells: { row: number; col: number }[]; // relative positions
  gradient: string;
}

const tetrisShapes: TetrisShape[] = [
  {
    type: 'I',
    cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }],
    gradient: 'from-cyan-400/40 to-cyan-600/30'
  },
  {
    type: 'O',
    cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }],
    gradient: 'from-yellow-400/40 to-yellow-600/30'
  },
  {
    type: 'T',
    cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 1 }],
    gradient: 'from-purple-400/40 to-purple-600/30'
  },
  {
    type: 'L',
    cells: [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }, { row: 2, col: 1 }],
    gradient: 'from-orange-400/40 to-orange-600/30'
  },
  {
    type: 'J',
    cells: [{ row: 0, col: 1 }, { row: 1, col: 1 }, { row: 2, col: 1 }, { row: 2, col: 0 }],
    gradient: 'from-blue-400/40 to-blue-600/30'
  },
  {
    type: 'S',
    cells: [{ row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 0 }, { row: 1, col: 1 }],
    gradient: 'from-green-400/40 to-green-600/30'
  },
  {
    type: 'Z',
    cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 1 }, { row: 1, col: 2 }],
    gradient: 'from-red-400/40 to-red-600/30'
  },
];

interface GridPosition {
  row: number;
  col: number;
}

interface TetrisBlock {
  id: number;
  shape: TetrisShape;
  gridPosition: GridPosition; // top-left corner in grid
  currentY: number; // current pixel Y position (for animation)
  targetY: number; // target pixel Y position
  productId: number;
  productName: string;
  productImage: string | null;
  isVisible: boolean;
}

export default function KitchenTetris() {
  const [blocks, setBlocks] = useState<TetrisBlock[]>([]);
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [containerHeight, setContainerHeight] = useState(600);
  const [gridRows, setGridRows] = useState(10); // Dynamic grid rows based on container height
  const [gridCols, setGridCols] = useState(16); // Dynamic grid cols based on container width
  const [layoutReady, setLayoutReady] = useState(0); // Counter to trigger spawn effect
  const containerRef = useRef<HTMLDivElement>(null);
  const preCalculatedLayoutRef = useRef<TetrisBlock[]>([]); // Pre-calculated layout
  const nextBlockIndexRef = useRef(0); // Index of next block to spawn from layout

  // Fetch products on mount
  useEffect(() => {
    async function loadProducts() {
      try {
        const fetchedProducts = await getAllProductsWithDetails();
        setProducts(fetchedProducts);
        console.log('📦 Loaded', fetchedProducts.length, 'products with images');

        // Log image info for debugging
        const productsWithImages = fetchedProducts.filter(p => p.images && p.images.length > 0);
        console.log('📷', productsWithImages.length, 'products have images');
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
    }
    loadProducts();
  }, []);

  // Pre-calculate entire Tetris layout when products or grid size changes
  useEffect(() => {
    if (products.length === 0 || gridRows === 0 || gridCols === 0) return;

    console.log('🎲 Pre-calculating Tetris layout...');

    // Initialize fresh grid for layout calculation
    const grid: boolean[][] = Array(gridRows).fill(null).map(() => Array(gridCols).fill(false));
    const layout: TetrisBlock[] = [];
    let productIndex = 0;
    let blockId = 0;

    // Helper function to check if a position is valid
    const isPositionValid = (shape: TetrisShape, row: number, col: number): boolean => {
      for (const cell of shape.cells) {
        const targetRow = row + cell.row;
        const targetCol = col + cell.col;

        if (targetRow < 0 || targetRow >= gridRows ||
            targetCol < 0 || targetCol >= gridCols) {
          return false;
        }

        if (grid[targetRow]?.[targetCol]) {
          return false;
        }
      }
      return true;
    };

    // Helper function to check if piece has landed
    const hasLanded = (shape: TetrisShape, row: number, col: number): boolean => {
      const maxRow = Math.max(...shape.cells.map(c => c.row));
      if (row + maxRow >= gridRows - 1) {
        return true;
      }
      return !isPositionValid(shape, row + 1, col);
    };

    // Fill the grid with Tetris blocks until completely full
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = tetrisShapes.length; // Stop only if all shapes fail

    while (consecutiveFailures < maxConsecutiveFailures) {
      const product = products[productIndex % products.length];
      productIndex++;

      // Shuffle shapes to try them in random order
      const shapesToTry = [...tetrisShapes];
      for (let i = shapesToTry.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shapesToTry[i], shapesToTry[j]] = [shapesToTry[j], shapesToTry[i]];
      }

      let placed = false;

      // Try each shape
      for (const shape of shapesToTry) {
        const minCol = Math.min(...shape.cells.map(c => c.col));
        const maxCol = Math.max(...shape.cells.map(c => c.col));
        const minRow = Math.min(...shape.cells.map(c => c.row));
        const maxRow = Math.max(...shape.cells.map(c => c.row));

        const maxStartCol = gridCols - (maxCol - minCol + 1);
        if (maxStartCol < 0) continue;

        const possibleCols = Array.from({ length: maxStartCol + 1 }, (_, i) => i);
        const lowestPossibleRow = gridRows - 1 - maxRow;

        // Find best position for this shape
        let bestPosition: { row: number; col: number } | null = null;
        let bestRow = -1;

        for (const col of possibleCols) {
          for (let row = lowestPossibleRow; row >= -minRow; row--) {
            if (isPositionValid(shape, row, col) && hasLanded(shape, row, col)) {
              if (row > bestRow) {
                bestRow = row;
                bestPosition = { row, col };
              }
              break;
            }
          }
        }

        if (bestPosition) {
          // Shuffle among positions at the same lowest row
          const positionsAtBestRow = possibleCols
            .filter(col => isPositionValid(shape, bestRow, col) && hasLanded(shape, bestRow, col))
            .map(col => ({ row: bestRow, col }));

          if (positionsAtBestRow.length > 0) {
            bestPosition = positionsAtBestRow[Math.floor(Math.random() * positionsAtBestRow.length)];
          }

          // Mark grid cells as occupied
          shape.cells.forEach(cell => {
            const targetRow = bestPosition!.row + cell.row;
            const targetCol = bestPosition!.col + cell.col;
            grid[targetRow][targetCol] = true;
          });

          // Create block with its own product image
          // Get product image or use placeholder
          let productImage = getFirstImageUrl(product.images || []);
          if (!productImage) {
            // Use placeholder if product has no image
            const seed = product.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            productImage = `https://picsum.photos/seed/${seed}/400/400`;
          }

          layout.push({
            id: blockId++,
            shape,
            gridPosition: bestPosition,
            currentY: -200, // Will animate from above
            targetY: bestPosition.row * CELL_SIZE,
            productId: product.id,
            productName: product.name,
            productImage,
            isVisible: false, // Will be revealed sequentially
          });

          placed = true;
          consecutiveFailures = 0; // Reset failure counter
          break; // Shape placed successfully
        }
      }

      // If no shape could be placed, increment failure counter
      if (!placed) {
        consecutiveFailures++;
        console.log(`⚠️ Failed to place block (${consecutiveFailures}/${maxConsecutiveFailures})`);
      }
    }

    console.log('✅ Layout complete:', layout.length, 'blocks (grid is full)');

    // Sort blocks by row (bottom to top) to prevent visual clipping during animation
    // Blocks with higher row numbers (closer to bottom) should spawn first
    layout.sort((a, b) => {
      // Primary sort: by row (descending - bottom to top)
      const rowDiff = b.gridPosition.row - a.gridPosition.row;
      if (rowDiff !== 0) return rowDiff;

      // Secondary sort: random (for unpredictable horizontal spawning)
      return Math.random() - 0.5;
    });

    preCalculatedLayoutRef.current = layout;
    nextBlockIndexRef.current = 0;
    setBlocks([]); // Reset blocks when layout changes
    setLayoutReady(prev => prev + 1); // Trigger spawn effect

    console.log('🎲 Pre-calculated', layout.length, 'blocks (sorted bottom to top)');
  }, [products, gridRows, gridCols]);


  // Update container dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        // Calculate grid rows and columns based on actual container dimensions
        // Use exact visible dimensions - blocks at edges may be clipped
        const calculatedRows = Math.ceil(height / CELL_SIZE);
        const calculatedCols = Math.ceil(width / CELL_SIZE);

        console.log('📏 Container dimensions:', {
          width,
          height,
          calculatedRows,
          calculatedCols,
          cellSize: CELL_SIZE,
          gridWidth: calculatedCols * CELL_SIZE,
          gridHeight: calculatedRows * CELL_SIZE,
          visibleWidth: width,
          visibleHeight: height
        });

        // Ensure we have valid dimensions
        if (width > 0) {
          setContainerWidth(width);
          setGridCols(calculatedCols);
        }
        if (height > 0) {
          setContainerHeight(height);
          setGridRows(calculatedRows);
        }
      }
    };

    // Initial update
    updateDimensions();

    // Wait for parent to render fully
    setTimeout(updateDimensions, 100);
    setTimeout(updateDimensions, 300);

    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Sequentially spawn blocks from pre-calculated layout
  useEffect(() => {
    if (preCalculatedLayoutRef.current.length === 0) return;

    console.log('🚀 Starting to spawn', preCalculatedLayoutRef.current.length, 'blocks');

    let timeoutId: NodeJS.Timeout;

    const spawnNextBlock = () => {
      const nextIndex = nextBlockIndexRef.current;

      if (nextIndex >= preCalculatedLayoutRef.current.length) {
        // All blocks spawned
        return;
      }

      const blockToSpawn = preCalculatedLayoutRef.current[nextIndex];
      console.log(`🔵 SPAWNING block ${nextIndex + 1}/${preCalculatedLayoutRef.current.length} at row=${blockToSpawn.gridPosition.row}, col=${blockToSpawn.gridPosition.col}`);

      setBlocks(currentBlocks => [
        ...currentBlocks,
        { ...blockToSpawn, isVisible: true }
      ]);

      nextBlockIndexRef.current++;

      // Random delay between 100-300ms for next spawn (more frequent)
      const randomDelay = 100 + Math.random() * 200;
      timeoutId = setTimeout(spawnNextBlock, randomDelay);
    };

    // Start spawning
    spawnNextBlock();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [layoutReady]); // Re-trigger when layout is recalculated

  // Animation loop - move blocks down to their target positions with consistent speed
  useEffect(() => {
    const animationInterval = setInterval(() => {
      setBlocks(currentBlocks =>
        currentBlocks.map(block => {
          if (block.currentY < block.targetY) {
            const distance = block.targetY - block.currentY;

            // Consistent falling speed with slight easing at the end
            // Use mostly constant speed, with gentle slowdown in last 50px
            const speed = distance < 50
              ? Math.max(distance * 0.2, 2) // Gentle slowdown near target
              : 8; // Constant speed for most of the fall

            const newY = Math.min(block.currentY + speed, block.targetY);
            return { ...block, currentY: newY };
          }
          return block;
        })
      );
    }, 16); // ~60fps for smoother animation

    return () => clearInterval(animationInterval);
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid overlay for debugging (optional) */}
      {/* <div className="absolute inset-0 grid" style={{
        gridTemplateColumns: `repeat(${gridCols}, ${CELL_SIZE}px)`,
        gridTemplateRows: `repeat(${gridRows}, ${CELL_SIZE}px)`,
      }}>
        {Array(gridRows * gridCols).fill(0).map((_, i) => (
          <div key={i} className="border border-white/10"></div>
        ))}
      </div> */}

      {/* Tetris blocks */}
      <div className="relative w-full h-full">
        {blocks.map(block => {
          // Calculate the bounding box of the shape
          const minRow = Math.min(...block.shape.cells.map(c => c.row));
          const maxRow = Math.max(...block.shape.cells.map(c => c.row));
          const minCol = Math.min(...block.shape.cells.map(c => c.col));
          const maxCol = Math.max(...block.shape.cells.map(c => c.col));

          const shapeWidth = (maxCol - minCol + 1) * CELL_SIZE;
          const shapeHeight = (maxRow - minRow + 1) * CELL_SIZE;

          // Actual rendered cell size (accounting for border)
          const renderedCellSize = CELL_SIZE - 4;

          // Background image dimensions (covers this specific block's shape)
          const renderedShapeWidth = (maxCol - minCol + 1) * renderedCellSize;
          const renderedShapeHeight = (maxRow - minRow + 1) * renderedCellSize;

          // Calculate centering offset
          const gridWidth = gridCols * CELL_SIZE;
          const offsetX = (containerWidth - gridWidth) / 2;

          return (
            <div
              key={block.id}
              className="absolute"
              style={{
                left: `${offsetX + block.gridPosition.col * CELL_SIZE}px`,
                top: `${block.currentY}px`,
                width: `${shapeWidth}px`,
                height: `${shapeHeight}px`,
              }}
            >
              {/* Render each cell of the tetris shape */}
              {block.shape.cells.map((cell, cellIndex) => {
                const cellLeft = (cell.col - minCol) * CELL_SIZE;
                const cellTop = (cell.row - minRow) * CELL_SIZE;

                // Background offset is based on position WITHIN this block
                // This makes each cell show a portion of this block's image
                const bgOffsetLeft = (cell.col - minCol) * renderedCellSize;
                const bgOffsetTop = (cell.row - minRow) * renderedCellSize;

                return (
                  <div
                    key={cellIndex}
                    className="absolute rounded shadow-md border-2 border-white/50 overflow-hidden"
                    style={{
                      left: `${cellLeft}px`,
                      top: `${cellTop}px`,
                      width: `${renderedCellSize}px`,
                      height: `${renderedCellSize}px`,
                    }}
                  >
                    {/* Product image - each block has its own image */}
                    {/* Each cell shows a portion of this block's image */}
                    {block.productImage ? (
                      <div
                        className="absolute inset-0 opacity-[0.35]"
                        style={{
                          backgroundImage: `url(${block.productImage})`,
                          backgroundSize: `${renderedShapeWidth}px ${renderedShapeHeight}px`,
                          backgroundPosition: `-${bgOffsetLeft}px -${bgOffsetTop}px`,
                          backgroundRepeat: 'no-repeat',
                        }}
                      />
                    ) : (
                      /* Fallback gradient if no image */
                      <div className={`absolute inset-0 bg-gradient-to-br ${block.shape.gradient} opacity-[0.35]`}></div>
                    )}

                    {/* Subtle overlay for depth */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20"></div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
