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

    // 2. Click "Get Started" to go to /login or /register
    console.log('Clicking Get Started...');
    await page.click('text=Get Started');
    await page.waitForURL('**/login');
    
    // Switch to Sign up tab
    await page.click('button:has-text("Sign up")');
    await page.waitForTimeout(500); // let animation finish

    // Generate random email
    const randId = Math.random().toString(36).substring(2, 8);
    const testEmail = `test.e2e.${randId}@example.com`;
    const testPassword = 'Password123!';

    console.log(`Registering account A: ${testEmail}`);
    await page.fill('input[name="name"]', 'Account A');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    
    // Select Role
    await page.selectOption('select[name="role"]', 'traveler');

    // Submit
    await page.click('button:has-text("Create account")');
    
    // Wait for redirect to dashboard
    try {
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      console.log('Successfully redirected to Dashboard.');
    } catch (e) {
      console.log('Could not reach dashboard automatically. Checking for email confirmation message...');
      const msgVisible = await page.isVisible('text=Account created');
      console.log('Account created message visible?', msgVisible);
      throw e;
    }

    // Create a new trip
    console.log('Navigating to Create Trip...');
    await page.click('button:has-text("Create new trip")');
    await page.waitForURL('**/trips/new');

    console.log('Filling trip details...');
    await page.fill('input[placeholder="e.g. Kyoto, Japan"]', 'Sylhet, Bangladesh');
    await page.fill('input[type="date"]', '2026-12-01');
    const dates = await page.$$('input[type="date"]');
    if (dates.length > 1) {
      await dates[1].fill('2026-12-10');
    }
    
    // Group type
    await page.click('button:has-text("Group")');

    await page.click('button:has-text("Create trip")');
    
    console.log('Waiting for trip detail page...');
    await page.waitForURL('**/trips/*', { timeout: 15000 });
    console.log('Successfully reached trip page.');
    
    const tripUrl = page.url();
    console.log(`Created Trip URL: ${tripUrl}`);

    // Wait for the trip to load (ensure we don't get the "No trip selected" error)
    await page.waitForSelector('text=Shared workspace');
    console.log('Workspace loaded.');

    console.log('ALL E2E TESTS PASSED!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
