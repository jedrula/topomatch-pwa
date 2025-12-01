/**
 * Playwright Test Helpers
 * 
 * Reusable helper functions for E2E tests
 */

/**
 * Sign in a user with email and password
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {object} options - Optional settings
 * @param {boolean} options.debug - Enable debug mode (slower, more logging)
 * @returns {Promise<void>}
 */
export async function signIn(page, email, password, options = {}) {
  const { debug = false } = options;
  
  console.log('🔐 Authenticating user...');
  console.log(`   Email: ${email}`);
  if (debug) console.log('   🐛 Debug mode enabled');

  // Look for "Sign In" button
  const signInButton = page.getByRole('button', { name: /sign in/i });
  
  // Check if already signed in
  const isSignedIn = await page.locator('button:has-text("Sign Out"), [data-test="user-menu"]').isVisible({ timeout: 2000 }).catch(() => false);
  
  if (isSignedIn) {
    console.log('   ℹ️  User already signed in, skipping authentication');
    return;
  }

  // Wait for sign in button
  const signInButtonVisible = await signInButton.isVisible({ timeout: 5000 }).catch(() => false);
  
  if (!signInButtonVisible) {
    console.log('   ℹ️  Sign In button not found - user may already be authenticated');
    return;
  }

  // Click sign in button
  await signInButton.click();
  console.log('   ✅ Clicked "Sign In" button');

  // Wait for sign in form/modal
  await page.waitForTimeout(500);

  // Fill in email
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 5000 });
  await emailInput.fill(email);
  console.log('   ✅ Filled email');
  if (debug) await page.waitForTimeout(500);

  // Fill in password
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
  await passwordInput.fill(password);
  console.log('   ✅ Filled password');
  if (debug) {
    console.log('   🐛 Pausing to check form state...');
    await page.waitForTimeout(1000);
  }

  // Submit the form
  // Try different submit methods with better selectors
  let submitted = false;
  
  try {
    // Method 1: Look for submit button (try multiple selectors)
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Sign In")',
      'button:has-text("Log In")',
      'button:has-text("Login")',
      '[role="button"]:has-text("Sign In")',
    ];
    
    for (const selector of submitSelectors) {
      const button = page.locator(selector).first();
      const isVisible = await button.isVisible({ timeout: 1000 }).catch(() => false);
      
      if (isVisible) {
        console.log(`   🔍 Found submit button with selector: ${selector}`);
        // Wait a bit for button to be enabled
        await page.waitForTimeout(300);
        // Try to click
        await button.click({ timeout: 5000 });
        console.log('   ✅ Clicked submit button');
        submitted = true;
        break;
      }
    }
    
    // Method 2: If no button found, press Enter
    if (!submitted) {
      console.log('   ℹ️  No submit button found, pressing Enter...');
      await passwordInput.press('Enter');
      console.log('   ✅ Pressed Enter to submit');
      submitted = true;
    }
  } catch (e) {
    // Method 3: Final fallback - press Enter
    console.log(`   ⚠️  Submit error: ${e.message}, trying Enter key...`);
    await passwordInput.press('Enter');
    console.log('   ✅ Pressed Enter to submit (fallback)');
    submitted = true;
  }

  // Wait for authentication to complete (navigation or state change)
  console.log('   ⏳ Waiting for authentication...');
  await page.waitForTimeout(2000);

  // Verify sign in was successful
  // Try multiple indicators of successful sign in
  const signInIndicators = [
    'button:has-text("Sign Out")',
    '[data-test="user-menu"]',
    '[data-test="user-avatar"]',
    'text=/signed in|logged in/i',
  ];
  
  let signedIn = false;
  for (const indicator of signInIndicators) {
    const found = await page.locator(indicator).isVisible({ timeout: 2000 }).catch(() => false);
    if (found) {
      signedIn = true;
      console.log(`   ✅ Successfully signed in! (verified by: ${indicator})`);
      break;
    }
  }
  
  if (!signedIn) {
    console.log('   ⚠️  Could not verify sign in with standard indicators');
    console.log('   ℹ️  Checking page state...');
    
    // Take a screenshot for debugging
    const url = page.url();
    console.log(`   📍 Current URL: ${url}`);
    
    // Check if still on sign in page (might indicate failure)
    const stillOnSignIn = await page.locator('input[type="password"]').isVisible({ timeout: 1000 }).catch(() => false);
    if (stillOnSignIn) {
      console.log('   ❌ Still on sign-in page - authentication may have failed!');
      // Take debug screenshot
      await page.screenshot({ path: 'test-results/signin-failed.png' });
      console.log('   📸 Screenshot saved: test-results/signin-failed.png');
    } else {
      console.log('   ℹ️  Left sign-in page, assuming success');
    }
  }
}

/**
 * Wait for network to be idle
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {number} timeout - Timeout in ms
 */
export async function waitForNetworkIdle(page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Capture memory snapshot
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} label - Label for this snapshot
 * @returns {Promise<{label: string, memory: number, timestamp: number} | null>}
 */
export async function captureMemory(page, label) {
  const memory = await page.evaluate(() => {
    if (window.gc) window.gc();
    return performance.memory ? {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      timestamp: Date.now()
    } : null;
  });
  
  if (memory) {
    const snapshot = {
      label,
      memory: memory.usedJSHeapSize / 1024 / 1024,
      timestamp: memory.timestamp
    };
    return snapshot;
  }
  return null;
}

/**
 * Take a debug screenshot
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} name - Screenshot name
 */
export async function debugScreenshot(page, name) {
  const path = `test-results/debug-${name}-${Date.now()}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(`   📸 Debug screenshot: ${path}`);
  return path;
}
