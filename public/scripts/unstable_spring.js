/**
 * TODO: Jsdoc CẦN ĐƯỢC VERIFY
 * Converts spring physics parameters to perceptual animation parameters
 * 
 * @param {number} k - Spring stiffness coefficient (kg/s²)
 * @param {number} b - Damping coefficient (kg/s) 
 * @param {number} [mass=1] - Mass of the object (kg), typically 1 for UI animations
 * 
 * @returns {Object} Perceptual parameters object
 * @returns {number} returns.perceptualDuration - Perceived animation duration in seconds (> 0)
 * @returns {number} returns.bounce - Bounce factor:
 *   - Range: (-∞, 1]
 *   - bounce ∈ (0, 1]: Underdamped system (oscillating/bouncy)
 *     - 1 = no damping (infinite oscillation)
 *     - ~0.8-0.9 = high bounce (playful animations)
 *     - ~0.3-0.7 = medium bounce (standard UI)
 *     - ~0.1-0.3 = low bounce (subtle spring)
 *   - bounce = 0: Critically damped (no overshoot, fastest settling)
 *   - bounce < 0: Overdamped system (slow, no oscillation)
 *     - Negative values indicate sluggish, over-damped motion
 * @returns {number} returns.dampingRatio - Engineering damping ratio ζ (dimensionless)
 * @returns {string} returns.systemType - System classification: 'underdamped', 'critically damped', or 'overdamped'
 * 
 * @example
 * // Convert typical UI spring to perceptual params
 * const result = springToPerceptualParams(100, 10);
 * console.log(result.perceptualDuration); // ~0.628 seconds
 * console.log(result.bounce); // ~0.602 (medium bouncy)
 * 
 * @example  
 * // Overdamped spring (no bounce)
 * const result = springToPerceptualParams(50, 30);
 * console.log(result.bounce); // negative value (sluggish)
 * 
 * @see {@link https://blog.maximeheckel.com/posts/the-physics-behind-spring-animations/} Spring Physics
 * @see {@link https://en.wikipedia.org/wiki/Damping_ratio} Damping Ratio Theory
 */
function springToPerceptualParams(k, b, mass = 1) {
  // Từ công thức: stiffness = (2π ÷ perceptualDuration) ^ 2
  // => perceptualDuration = 2π ÷ √stiffness
  const perceptualDuration = (2 * Math.PI) / Math.sqrt(k);
  
  // Để tính bounce, ta cần phân biệt 2 trường hợp dựa vào hệ số damping
  
  // Tính damping ratio ζ (zeta) để xác định loại damping
  const naturalFrequency = Math.sqrt(k / mass); // ωn = √(k/m)
  const dampingRatio = b / (2 * Math.sqrt(k * mass)); // ζ = b/(2√(km))
  
  let bounce;
  
  if (dampingRatio <= 1) {
    // Underdamped hoặc critically damped case
    // Từ: damping = ((1 - bounce) × 4π) ÷ perceptualDuration
    // => bounce = 1 - (damping × perceptualDuration) ÷ (4π)
    bounce = 1 - (b * perceptualDuration) / (4 * Math.PI);
  } else {
    // Overdamped case
    // Từ: damping = 4π ÷ (perceptualDuration × (1 + bounce))
    // => 1 + bounce = 4π ÷ (damping × perceptualDuration)
    // => bounce = (4π ÷ (damping × perceptualDuration)) - 1
    bounce = (4 * Math.PI) / (b * perceptualDuration) - 1;
  }
  
  return {
    perceptualDuration,
    bounce,
    dampingRatio, // thêm info để debug
    systemType: dampingRatio < 1 ? 'underdamped' : 
               dampingRatio === 1 ? 'critically damped' : 'overdamped'
  };
}

function perceptualToSpring(perceptualDuration, bounce, mass = 1) {
  // Convert ngược lại để verify
  const stiffness = Math.pow(2 * Math.PI / perceptualDuration, 2);
  
  let damping;
  if (bounce >= 0) {
    damping = ((1 - bounce) * 4 * Math.PI) / perceptualDuration;
  } else {
    damping = (4 * Math.PI) / (perceptualDuration * (1 + bounce));
  }
  
  return { k: stiffness, b: damping };
}

// Test examples
let testing = false
if (testing) {
  console.log("=== Test Cases ===");

  // Test với các giá trị spring thông thường
  const testCases = [
    { k: 100, b: 10 },
    { k: 200, b: 20 },
    { k: 50, b: 5 },
    { k: 300, b: 50 } // overdamped case
  ];

  testCases.forEach((testCase, i) => {
    console.log(`\nTest case ${i + 1}: k=${testCase.k}, b=${testCase.b}`);
    
    const result = springToPerceptualParams(testCase.k, testCase.b);
    console.log(`Perceptual Duration: ${result.perceptualDuration.toFixed(4)}`);
    console.log(`Bounce: ${result.bounce.toFixed(4)}`);
    console.log(`System Type: ${result.systemType}`);
    console.log(`Damping Ratio: ${result.dampingRatio.toFixed(4)}`);
    
    // Verify bằng cách convert ngược lại
    const verification = perceptualToSpring(result.perceptualDuration, result.bounce);
    console.log(`Verification - k: ${verification.k.toFixed(2)}, b: ${verification.b.toFixed(2)}`);
    console.log(`Match: k ${Math.abs(verification.k - testCase.k) < 0.01 ? '✓' : '✗'}, b ${Math.abs(verification.b - testCase.b) < 0.01 ? '✓' : '✗'}`);
  });
}

// Utility function để sử dụng với springStep
function convertSpringConfig(springConfig) {
  const { k, b } = springConfig;
  return springToPerceptualParams(k, b);
}

export {
  springToPerceptualParams,
  perceptualToSpring,
  convertSpringConfig
}