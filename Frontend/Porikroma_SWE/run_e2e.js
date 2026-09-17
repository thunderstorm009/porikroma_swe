import { chromium } from 'playwright';

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Load the Landing page
    console.log('Navigating to http://localhost:5173/');
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    // 2. Click "Log in" instead of Get Started
    console.log('Clicking Log in...');
    await page.click('text=Log in');
    await page.waitForURL('**/login');
    
    // Perform Login
    const testEmail = 'test.admin.e2e@example.com';
    const testPassword = 'Password123!';

    console.log(`Logging in with account: ${testEmail}`);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard or error
    try {
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      console.log('Successfully redirected to Dashboard.');
    } catch (e) {
      console.log('Could not reach dashboard automatically. Checking for errors...');
      const errorMsg = await page.locator('.text-red-700').textContent({ timeout: 1000 }).catch(() => null);
      if (errorMsg) {
        console.error('Login error:', errorMsg);
        throw new Error(`Login failed: ${errorMsg}`);
      }
      throw e;
    }

    // Create a new trip
    console.log('Navigating to Create Trip...');
    await page.click('button:has-text("Plan a new trip")');
    await page.waitForURL('**/trips/new');

    console.log('Filling trip details (Step 0 - Type)...');
    await page.click('text="Group"', { force: true });
    await page.waitForTimeout(500);
    await page.click('button:has-text("Continue")', { force: true });
    await page.waitForTimeout(500);

    console.log('Filling trip details (Step 1 - Destination)...');
    await page.fill('input[placeholder="Try Cox\'s Bazar, Sajek..."]', 'Sylhet');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Continue")', { force: true });
    await page.waitForTimeout(500);

    console.log('Filling trip details (Step 2 - Dates & Budget)...');
    await page.fill('input[id="start-date"]', '2026-12-01');
    await page.fill('input[id="end-date"]', '2026-12-10');
    await page.fill('input[id="budget"]', '10000');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Continue")', { force: true });
    await page.waitForTimeout(500);

    console.log('Filling trip details (Step 3 - Preferences)...');
    await page.click('button:has-text("Generate mock plans")', { force: true });
    await page.waitForTimeout(500);

    console.log('Filling trip details (Step 4 - Plans)...');
    await page.click('button:has-text("Create group trip")');
    
    console.log('Waiting for trip detail page...');
    await page.waitForURL(/\/trips\/[0-9a-fA-F-]+/, { timeout: 15000 });
    console.log('Successfully reached trip page.');
    
    // Log the created trip URL
    const tripUrl = page.url();
    console.log(`Created Trip URL: ${tripUrl}`);
    
    // Check if we can see the workspace tabs
    await page.waitForSelector('.travel-workspace-tabs', { timeout: 10000 });
    console.log('Workspace loaded.');
    
    console.log('ALL E2E TESTS PASSED!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
