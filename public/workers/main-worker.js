/**
 * Main Web Worker
 * 
 * This worker handles CPU-intensive operations to keep the main thread responsive.
 * It supports various operations including:
 * - Image processing (resizing, format conversion)
 * - Blurhash generation and decoding
 * - Data transformation
 * - Animation calculations
 */

// Set up worker context
self.onmessage = function(event) {
  const { id, type, payload } = event.data;
  
  // Process the message based on its type
  switch (type) {
    case 'generateBlurhash':
      handleBlurhashGeneration(id, payload);
      break;
    case 'decodeBlurhash':
      handleBlurhashDecoding(id, payload);
      break;
    case 'processImage':
      handleImageProcessing(id, payload);
      break;
    case 'transformData':
      handleDataTransformation(id, payload);
      break;
    case 'calculatePhysics':
      handlePhysicsCalculation(id, payload);
      break;
    case 'calculatePath':
      handlePathCalculation(id, payload);
      break;
    default:
      self.postMessage({
        id,
        error: `Unknown operation type: ${type}`
      });
  }
};

/**
 * Handle blurhash generation
 * @param {string} id - Message ID
 * @param {Object} payload - Operation payload
 */
async function handleBlurhashGeneration(id, payload) {
  try {
    const { src, width = 32, height = 32, componentX = 4, componentY = 3 } = payload;
    
    // Fetch the image
    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    // Create an image from the buffer
    const imageData = await createImageData(arrayBuffer, width, height);
    
    // Import the blurhash library (using importScripts for web worker context)
    // Note: In a real implementation, you'd bundle the blurhash library with the worker
    importScripts('https://unpkg.com/blurhash@2.0.5/dist/blurhash.min.js');
    
    // Generate the blurhash
    const hash = self.blurhash.encode(
      imageData.data,
      imageData.width,
      imageData.height,
      componentX,
      componentY
    );
    
    // Send the result back to the main thread
    self.postMessage({
      id,
      result: hash
    });
  } catch (error) {
    self.postMessage({
      id,
      error: error.message
    });
  }
}

/**
 * Handle blurhash decoding
 * @param {string} id - Message ID
 * @param {Object} payload - Operation payload
 */
function handleBlurhashDecoding(id, payload) {
  try {
    const { blurhash, width = 32, height = 32 } = payload;
    
    // Import the blurhash library if not already imported
    if (!self.blurhash) {
      importScripts('https://unpkg.com/blurhash@2.0.5/dist/blurhash.min.js');
    }
    
    // Decode the blurhash
    const pixels = self.blurhash.decode(blurhash, width, height);
    
    // Send the result back to the main thread
    self.postMessage({
      id,
      result: pixels
    });
  } catch (error) {
    self.postMessage({
      id,
      error: error.message
    });
  }
}

/**
 * Handle image processing operations
 * @param {string} id - Message ID
 * @param {Object} payload - Operation payload
 */
async function handleImageProcessing(id, payload) {
  try {
    const { src, operation, options } = payload;
    
    // Fetch the image
    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    // Process the image based on the operation type
    let result;
    switch (operation) {
      case 'resize':
        result = await resizeImage(arrayBuffer, options);
        break;
      case 'crop':
        result = await cropImage(arrayBuffer, options);
        break;
      case 'format':
        result = await convertFormat(arrayBuffer, options);
        break;
      default:
        throw new Error(`Unknown image operation: ${operation}`);
    }
    
    // Send the result back to the main thread
    self.postMessage({
      id,
      result,
      processed: true
    });
  } catch (error) {
    self.postMessage({
      id,
      error: error.message,
      processed: false
    });
  }
}

/**
 * Handle data transformation operations
 * @param {string} id - Message ID
 * @param {Object} payload - Operation payload
 */
function handleDataTransformation(id, payload) {
  try {
    const { data, transformation, options } = payload;
    
    // Process the data based on the transformation type
    let result;
    switch (transformation) {
      case 'filter':
        result = data.filter(item => {
          // Apply filter criteria from options
          const { key, value, operator = '==' } = options;
          switch (operator) {
            case '==':
              return item[key] == value;
            case '===':
              return item[key] === value;
            case '>':
              return item[key] > value;
            case '>=':
              return item[key] >= value;
            case '<':
              return item[key] < value;
            case '<=':
              return item[key] <= value;
            default:
              return true;
          }
        });
        break;
      case 'map':
        result = data.map(item => {
          // Apply mapping function from options
          const { transformFn } = options;
          if (typeof transformFn === 'string') {
            // Convert string function to actual function
            const fn = new Function('item', transformFn);
            return fn(item);
          }
          return item;
        });
        break;
      case 'sort':
        result = [...data].sort((a, b) => {
          const { key, direction = 'asc' } = options;
          const multiplier = direction === 'asc' ? 1 : -1;
          if (a[key] < b[key]) return -1 * multiplier;
          if (a[key] > b[key]) return 1 * multiplier;
          return 0;
        });
        break;
      default:
        throw new Error(`Unknown data transformation: ${transformation}`);
    }
    
    // Send the result back to the main thread
    self.postMessage({
      id,
      result
    });
  } catch (error) {
    self.postMessage({
      id,
      error: error.message
    });
  }
}

/**
 * Handle physics calculations for animations
 * @param {string} id - Message ID
 * @param {Object} payload - Operation payload
 */
function handlePhysicsCalculation(id, payload) {
  try {
    const { properties, params, duration = 1, steps = 60 } = payload;
    
    // Calculate physics-based animation values
    const results = {};
    
    // Initialize results for each property
    properties.forEach(prop => {
      results[prop] = new Array(steps);
    });
    
    // Calculate values for each step
    for (let i = 0; i < steps; i++) {
      const progress = i / (steps - 1);
      const time = progress * duration;
      
      // Apply physics calculations for each property
      properties.forEach(prop => {
        // Get property-specific parameters
        const propParams = params[prop] || {};
        const {
          initialValue = 0,
          finalValue = 100,
          elasticity = 0.8,
          damping = 0.5,
          gravity = 0
        } = propParams;
        
        // Calculate value based on physics simulation
        // This is a simplified spring physics model
        const distance = finalValue - initialValue;
        const spring = Math.sin(progress * Math.PI * (1 + elasticity)) * Math.exp(-progress * damping);
        const gravityEffect = 0.5 * gravity * time * time;
        
        // Combine effects
        const value = initialValue + distance * (progress - spring) + gravityEffect;
        
        // Store the calculated value
        results[prop][i] = value;
      });
    }
    
    // Send the result back to the main thread
    self.postMessage({
      id,
      result: results
    });
  } catch (error) {
    self.postMessage({
      id,
      error: error.message
    });
  }
}

/**
 * Handle path calculations for animations
 * @param {string} id - Message ID
 * @param {Object} payload - Operation payload
 */
function handlePathCalculation(id, payload) {
  try {
    const { path, points = 100 } = payload;
    
    // Parse SVG path and calculate points along it
    const pathPoints = calculatePointsAlongPath(path, points);
    
    // Send the result back to the main thread
    self.postMessage({
      id,
      result: pathPoints
    });
  } catch (error) {
    self.postMessage({
      id,
      error: error.message
    });
  }
}

/**
 * Create image data from an array buffer
 * @param {ArrayBuffer} buffer - Image buffer
 * @param {number} width - Target width
 * @param {number} height - Target height
 * @returns {ImageData} - Processed image data
 */
async function createImageData(buffer, width, height) {
  // Create a blob from the buffer
  const blob = new Blob([buffer]);
  const imageUrl = URL.createObjectURL(blob);
  
  // Create an image element
  const img = new Image();
  
  // Wait for the image to load
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = imageUrl;
  });
  
  // Create a canvas to draw the image
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Draw the image to the canvas, resizing it
  ctx.drawImage(img, 0, 0, width, height);
  
  // Get the image data
  const imageData = ctx.getImageData(0, 0, width, height);
  
  // Clean up
  URL.revokeObjectURL(imageUrl);
  
  return imageData;
}

/**
 * Resize an image
 * @param {ArrayBuffer} buffer - Image buffer
 * @param {Object} options - Resize options
 * @returns {string} - Data URL of the resized image
 */
async function resizeImage(buffer, options) {
  const { width, height, quality = 0.8 } = options;
  
  // Create a blob from the buffer
  const blob = new Blob([buffer]);
  const imageUrl = URL.createObjectURL(blob);
  
  // Create an image element
  const img = new Image();
  
  // Wait for the image to load
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = imageUrl;
  });
  
  // Calculate dimensions while maintaining aspect ratio if needed
  let targetWidth = width;
  let targetHeight = height;
  
  if (width && !height) {
    targetHeight = img.height * (width / img.width);
  } else if (height && !width) {
    targetWidth = img.width * (height / img.height);
  }
  
  // Create a canvas to draw the image
  const canvas = new OffscreenCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');
  
  // Draw the image to the canvas, resizing it
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  
  // Convert the canvas to a blob
  const resizedBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
  
  // Convert the blob to a data URL
  const reader = new FileReader();
  const dataUrl = await new Promise(resolve => {
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(resizedBlob);
  });
  
  // Clean up
  URL.revokeObjectURL(imageUrl);
  
  return dataUrl;
}

/**
 * Crop an image
 * @param {ArrayBuffer} buffer - Image buffer
 * @param {Object} options - Crop options
 * @returns {string} - Data URL of the cropped image
 */
async function cropImage(buffer, options) {
  const { width, height, x = 0, y = 0, quality = 0.8 } = options;
  
  // Create a blob from the buffer
  const blob = new Blob([buffer]);
  const imageUrl = URL.createObjectURL(blob);
  
  // Create an image element
  const img = new Image();
  
  // Wait for the image to load
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = imageUrl;
  });
  
  // Create a canvas to draw the image
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Draw the image to the canvas, cropping it
  ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
  
  // Convert the canvas to a blob
  const croppedBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
  
  // Convert the blob to a data URL
  const reader = new FileReader();
  const dataUrl = await new Promise(resolve => {
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(croppedBlob);
  });
  
  // Clean up
  URL.revokeObjectURL(imageUrl);
  
  return dataUrl;
}

/**
 * Convert an image to a different format
 * @param {ArrayBuffer} buffer - Image buffer
 * @param {Object} options - Conversion options
 * @returns {string} - Data URL of the converted image
 */
async function convertFormat(buffer, options) {
  const { format = 'jpeg', quality = 0.8 } = options;
  
  // Create a blob from the buffer
  const blob = new Blob([buffer]);
  const imageUrl = URL.createObjectURL(blob);
  
  // Create an image element
  const img = new Image();
  
  // Wait for the image to load
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = imageUrl;
  });
  
  // Create a canvas to draw the image
  const canvas = new OffscreenCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  
  // Draw the image to the canvas
  ctx.drawImage(img, 0, 0);
  
  // Determine the MIME type based on the format
  let mimeType;
  switch (format.toLowerCase()) {
    case 'jpeg':
    case 'jpg':
      mimeType = 'image/jpeg';
      break;
    case 'png':
      mimeType = 'image/png';
      break;
    case 'webp':
      mimeType = 'image/webp';
      break;
    default:
      mimeType = 'image/jpeg';
  }
  
  // Convert the canvas to a blob
  const convertedBlob = await canvas.convertToBlob({ type: mimeType, quality });
  
  // Convert the blob to a data URL
  const reader = new FileReader();
  const dataUrl = await new Promise(resolve => {
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(convertedBlob);
  });
  
  // Clean up
  URL.revokeObjectURL(imageUrl);
  
  return dataUrl;
}

/**
 * Calculate points along an SVG path
 * @param {string} pathString - SVG path string
 * @param {number} numPoints - Number of points to calculate
 * @returns {Array} - Array of points along the path
 */
function calculatePointsAlongPath(pathString, numPoints) {
  // This is a simplified implementation
  // In a real implementation, you would use a proper SVG path parser
  
  // For now, we'll just return dummy points along a sine wave
  const points = [];
  
  for (let i = 0; i < numPoints; i++) {
    const progress = i / (numPoints - 1);
    const x = progress * 100;
    const y = 50 + Math.sin(progress * Math.PI * 2) * 25;
    
    points.push({ x, y });
  }
  
  return points;
}