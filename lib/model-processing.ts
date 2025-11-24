/**
 * 3D Model Processing
 *
 * Handles 3D model optimization, format conversion, and preview image generation.
 *
 * IMPORTANT: This module must only be used in server-side contexts (API routes, server components).
 * It uses Node.js-specific APIs and libraries that are not compatible with the browser.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

/**
 * Optimizes a GLB file to reduce file size
 *
 * Uses gltfpack CLI (via npx) for optimization with meshopt compression.
 * Meshopt compression provides excellent compression ratios. Requires model-viewer 3.5+
 * with proper decoder configuration.
 *
 * Note: For production use, install gltfpack globally:
 * npm install -g gltfpack
 *
 * @param buffer - GLB file buffer
 * @returns Optimized GLB buffer
 */
export async function optimizeGLB(buffer: Buffer): Promise<Buffer> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'glb-optimize-'));

  try {
    const inputPath = path.join(tmpDir, 'input.glb');
    const outputPath = path.join(tmpDir, 'output.glb');

    // Write buffer to temp file
    await fs.writeFile(inputPath, buffer);

    console.log('Optimizing GLB using gltfpack with meshopt compression...');

    try {
      // Use npx to run gltfpack (downloads if not installed)
      // Flags:
      // -i: input file
      // -o: output file
      // -cc: use meshopt compression
      await execAsync(
        `npx --yes gltfpack@latest -i "${inputPath}" -o "${outputPath}" -cc`,
        { timeout: 120000 } // 120 second timeout for large models
      );

      // Read optimized file
      const optimizedBuffer = await fs.readFile(outputPath);
      console.log(`✓ GLB optimized with meshopt: ${(buffer.length / 1024 / 1024).toFixed(2)}MB -> ${(optimizedBuffer.length / 1024 / 1024).toFixed(2)}MB`);
      return optimizedBuffer;
    } catch (cliError) {
      console.warn('gltfpack CLI not available or failed, skipping optimization:', cliError);
      // Return original buffer if CLI fails
      return buffer;
    }
  } catch (error) {
    console.error('GLB optimization error:', error);
    // If optimization fails, return original buffer
    return buffer;
  } finally {
    // Cleanup temp directory
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
  }
}

/**
 * Generates a preview image from a 3D model
 *
 * Currently uses Blender for rendering (requires Blender to be installed).
 * Alternative: Use a headless browser with Three.js or an external rendering service.
 *
 * @param glbBuffer - GLB file buffer
 * @param width - Image width (default: 800)
 * @param height - Image height (default: 800)
 * @returns PNG image buffer
 */
export async function generateModelPreview(
  glbBuffer: Buffer,
  width: number = 800,
  height: number = 800
): Promise<Buffer> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'model-preview-'));

  try {
    const inputPath = path.join(tmpDir, 'model.glb');
    const outputPath = path.join(tmpDir, 'preview.png');

    // Write GLB buffer to temp file
    await fs.writeFile(inputPath, glbBuffer);

    // Check if Blender is installed
    try {
      await execAsync('blender --version');
    } catch {
      throw new Error(
        'Blender is not installed or not in PATH. ' +
        'Preview generation requires Blender. ' +
        'Install with: brew install blender (macOS) or sudo snap install blender --classic (Ubuntu)'
      );
    }

    // Blender Python script to render the model
    const blenderScript = `
import bpy
import math

print("Starting Blender render script...")

# Clear default scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
print("Cleared default scene")

# Import GLB
print("Importing GLB from: ${inputPath.replace(/\\/g, '\\\\')}")
bpy.ops.import_scene.gltf(filepath='${inputPath.replace(/\\/g, '\\\\')}')

# Get all imported objects
imported_objects = list(bpy.context.selected_objects)
print(f"Imported {len(imported_objects)} objects")

if imported_objects:
    # Get all mesh objects for proper bounding box calculation
    mesh_objects = [obj for obj in imported_objects if obj.type == 'MESH']

    if not mesh_objects:
        print("No mesh objects found!")
        mesh_objects = imported_objects

    # Calculate world-space bounding box
    min_coords = [float('inf')] * 3
    max_coords = [float('-inf')] * 3

    for obj in mesh_objects:
        for vertex in obj.bound_box:
            world_vertex = obj.matrix_world @ bpy.data.meshes[obj.data.name].vertices[0].co if obj.data.vertices else obj.matrix_world @ obj.location
            for i in range(3):
                min_coords[i] = min(min_coords[i], world_vertex[i])
                max_coords[i] = max(max_coords[i], world_vertex[i])

    # Calculate center and size
    center = [(min_coords[i] + max_coords[i]) / 2 for i in range(3)]
    size = [(max_coords[i] - min_coords[i]) for i in range(3)]
    max_dim = max(size) if max(size) > 0 else 1.0

    print(f"Model center: {center}")
    print(f"Model size: {size}")
    print(f"Max dimension: {max_dim}")

    # Set up camera
    camera = bpy.data.cameras.new("Camera")
    camera_obj = bpy.data.objects.new("Camera", camera)
    bpy.context.scene.collection.objects.link(camera_obj)
    bpy.context.scene.camera = camera_obj

    # Position camera to frame the model
    distance = max_dim * 2.5
    camera_obj.location = (
        center[0] + distance * 0.7,
        center[1] - distance * 0.7,
        center[2] + distance * 0.5
    )

    # Point camera at center using Track To constraint
    track_constraint = camera_obj.constraints.new(type='TRACK_TO')

    # Create an empty at the center for camera to track
    empty = bpy.data.objects.new("CameraTarget", None)
    empty.location = center
    bpy.context.scene.collection.objects.link(empty)
    track_constraint.target = empty
    track_constraint.track_axis = 'TRACK_NEGATIVE_Z'
    track_constraint.up_axis = 'UP_Y'

    print(f"Camera positioned at: {camera_obj.location}")

    # Set up multiple lights for better illumination
    # Key light (main light)
    key_light = bpy.data.lights.new("KeyLight", 'SUN')
    key_light.energy = 2.0
    key_light_obj = bpy.data.objects.new("KeyLight", key_light)
    bpy.context.scene.collection.objects.link(key_light_obj)
    key_light_obj.location = (center[0] + max_dim * 2, center[1] - max_dim * 2, center[2] + max_dim * 3)
    key_light_obj.rotation_euler = (math.radians(45), 0, math.radians(135))

    # Fill light (softer, from opposite side)
    fill_light = bpy.data.lights.new("FillLight", 'AREA')
    fill_light.energy = 300
    fill_light.size = max_dim
    fill_light_obj = bpy.data.objects.new("FillLight", fill_light)
    bpy.context.scene.collection.objects.link(fill_light_obj)
    fill_light_obj.location = (center[0] - max_dim, center[1] + max_dim, center[2] + max_dim)

# Use Eevee for faster rendering
bpy.context.scene.render.engine = 'BLENDER_EEVEE'
bpy.context.scene.eevee.use_gtao = True  # Ambient occlusion
bpy.context.scene.eevee.use_ssr = True   # Screen space reflections

# Configure render settings
bpy.context.scene.render.image_settings.file_format = 'PNG'
bpy.context.scene.render.filepath = '${outputPath.replace(/\\/g, '\\\\')}'
bpy.context.scene.render.resolution_x = ${width}
bpy.context.scene.render.resolution_y = ${height}
bpy.context.scene.render.film_transparent = False

# Set background color to match ModelViewer (#f3f4f6 = gray-100)
bpy.context.scene.world.use_nodes = True
bg_node = bpy.context.scene.world.node_tree.nodes.get("Background")
if bg_node:
    # RGB values: 243/255=0.953, 244/255=0.957, 246/255=0.965
    bg_node.inputs[0].default_value = (0.953, 0.957, 0.965, 1)  # #f3f4f6
    bg_node.inputs[1].default_value = 1.0  # Strength

print("Starting render...")
# Render
bpy.ops.render.render(write_still=True)
print(f"Render complete! Saved to: ${outputPath.replace(/\\/g, '\\\\')}")
`;

    const scriptPath = path.join(tmpDir, 'render.py');
    await fs.writeFile(scriptPath, blenderScript);

    // Execute Blender to render the preview
    const { stdout, stderr } = await execAsync(
      `blender --background --python "${scriptPath}"`,
      { timeout: 60000 } // 60 second timeout
    );

    console.log('Blender render output:', stdout);
    if (stderr) console.error('Blender render errors:', stderr);

    // Read the rendered image
    const imageBuffer = await fs.readFile(outputPath);

    return imageBuffer;
  } catch (error) {
    console.error('Model preview generation error:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to generate model preview'
    );
  } finally {
    // Cleanup temp directory
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
  }
}

/**
 * Converts SKP (SketchUp) file to GLB format
 *
 * IMPORTANT: SKP conversion is not currently supported.
 *
 * Blender does not have native SKP import support. To use SKP files:
 *
 * Option 1: Convert SKP to COLLADA (.dae) or OBJ first using SketchUp
 * Option 2: Use an online converter to convert SKP to GLB
 * Option 3: Export from SketchUp directly as COLLADA, then upload
 *
 * This function is kept for future implementation with external tools.
 *
 * @param skpBuffer - SKP file buffer
 * @returns GLB file buffer
 */
export async function convertSKPtoGLB(skpBuffer: Buffer): Promise<Buffer> {
  // SKP conversion requires special tools that aren't readily available
  // Blender doesn't support SKP import out of the box

  throw new Error(
    'SKP file conversion is not currently supported. ' +
    'Please export your model from SketchUp as COLLADA (.dae) or directly as GLB/GLTF, ' +
    'or use an online converter like: https://products.aspose.app/3d/conversion/skp-to-glb'
  );

  /*
   * Future implementation options:
   * 1. Use FreeCAD with Python bindings (supports SKP import)
   * 2. Use assimp command-line tool (supports SKP)
   * 3. Use a cloud-based conversion service
   * 4. Integrate with SketchUp's official SDK
   */
}

/**
 * Validates if a file is a valid GLB file
 *
 * @param buffer - File buffer
 * @returns true if valid GLB
 */
export function isValidGLB(buffer: Buffer): boolean {
  // GLB files start with magic number: 0x46546C67 ("glTF" in ASCII)
  if (buffer.length < 12) return false;

  const magic = buffer.readUInt32LE(0);
  const expectedMagic = 0x46546C67;

  return magic === expectedMagic;
}

/**
 * Gets file size in MB
 *
 * @param buffer - File buffer
 * @returns Size in MB (2 decimal places)
 */
export function getFileSizeMB(buffer: Buffer): number {
  return parseFloat((buffer.length / (1024 * 1024)).toFixed(2));
}
