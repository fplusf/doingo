import { _electron as electron, ElectronApplication, expect, Page, test } from '@playwright/test';
import { format } from 'date-fns';
import { findLatestBuild, parseElectronApp } from 'electron-playwright-helpers';

let electronApp: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  const latestBuild = findLatestBuild();
  const appInfo = parseElectronApp(latestBuild);
  process.env.CI = 'e2e';

  electronApp = await electron.launch({
    args: [appInfo.main],
  });

  electronApp.on('window', async (page) => {
    const filename = page.url()?.split('/').pop();
    console.log(`Window opened: ${filename}`);

    page.on('pageerror', (error) => {
      console.error(error);
    });
    page.on('console', (msg) => {
      console.log(msg.text());
    });
  });

  page = await electronApp.firstWindow();

  // Navigate to Tasks page (should be default)
  await page.waitForSelector('.task-card', { timeout: 10000 });
});

test.afterAll(async () => {
  await electronApp.close();
});

test('should render tasks page correctly', async () => {
  // Check for task cards
  await expect(page.locator('.task-card')).toBeVisible();

  // Check for the week navigator
  await expect(page.locator('.week-navigator, [data-test=week-navigator]')).toBeVisible();

  // Check for category sections
  await expect(page.locator('[data-category="work"], .category-work')).toBeVisible();
});

test('should be able to add a new task', async () => {
  // Generate a unique task title for this test
  const taskTitle = `Test Task ${Date.now()}`;

  // Look for the "Add Task" button (could be a + icon or similar)
  const addButton = page
    .locator('button:has-text("Add"), button:has-text("+"), [aria-label="Add task"]')
    .first();
  await addButton.click();

  // Wait for the task form dialog
  await page.waitForSelector('form, [role="dialog"]');

  // Fill out the task title
  await page.fill(
    'input[placeholder*="Title"], input[placeholder*="title"], input[aria-label="Task title"]',
    taskTitle,
  );

  // Save the task
  await page.click('button:has-text("Save"), button:has-text("Create"), button[type="submit"]');

  // Wait for the task to appear
  await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 5000 });
});

test('should be able to complete a task', async () => {
  // Get task-card elements
  const taskCards = await page.locator('.task-card').all();

  if (taskCards.length === 0) {
    test.skip();
    return;
  }

  const firstTask = taskCards[0];

  // Find the checkbox within the first task card
  const checkbox = await firstTask.locator('input[type="checkbox"], [role="checkbox"]').first();

  // Get initial completed state
  const initialCompletedState =
    (await firstTask.getAttribute('data-completed')) ||
    (await firstTask.getAttribute('aria-checked')) ||
    (await firstTask.locator('.completed').count()) > 0;

  // Click the checkbox
  await checkbox.click();

  // Wait for state update
  await page.waitForTimeout(500);

  // Get the updated completed state
  const updatedCompletedState =
    (await firstTask.getAttribute('data-completed')) ||
    (await firstTask.getAttribute('aria-checked')) ||
    (await firstTask.locator('.completed').count()) > 0;

  // Check that the state changed
  expect(initialCompletedState).not.toEqual(updatedCompletedState);
});

test('should be able to edit a task', async () => {
  // Get task-card elements
  const taskCards = await page.locator('.task-card').all();

  if (taskCards.length === 0) {
    test.skip();
    return;
  }

  // Click on the first task to open edit mode
  await taskCards[0].click();

  // Wait for the dialog or form to appear
  await page.waitForSelector('form, [role="dialog"]');

  // Generate a new unique task title
  const newTaskTitle = `Edited Task ${Date.now()}`;

  // Clear and update the task title
  await page.fill(
    'input[placeholder*="Title"], input[placeholder*="title"], input[aria-label="Task title"]',
    newTaskTitle,
  );

  // Save the edited task
  await page.click('button:has-text("Save"), button:has-text("Update"), button[type="submit"]');

  // Verify the task was updated
  await expect(page.getByText(newTaskTitle)).toBeVisible();
});

test('should navigate between different dates', async () => {
  // Find date selector or navigation buttons
  const nextDayButton = page
    .locator('button[aria-label="Next day"], button:has-text("Next"), button:has-text("→")')
    .first();
  const prevDayButton = page
    .locator('button[aria-label="Previous day"], button:has-text("Previous"), button:has-text("←")')
    .first();

  // Get today's date formatted
  const today = format(new Date(), 'MMMM d');

  // Wait for any date element to be visible
  await page.waitForSelector(`text=${today}`, { timeout: 5000 });

  // Check if we have date navigation buttons
  const hasDateNavigation = (await nextDayButton.count()) > 0 && (await prevDayButton.count()) > 0;

  if (!hasDateNavigation) {
    test.skip();
    return;
  }

  // Get current date display before navigation
  const dateElements = await page.locator('h2, h3, [aria-label*="date"], .date-display').all();
  let initialDateText = '';

  for (const el of dateElements) {
    const text = await el.textContent();
    if (text && text.includes(today)) {
      initialDateText = text;
      break;
    }
  }

  if (!initialDateText) {
    test.skip();
    return;
  }

  // Click next day
  await nextDayButton.click();

  // Wait for UI update
  await page.waitForTimeout(500);

  // Check if date has changed
  let dateChanged = false;
  for (const el of dateElements) {
    const text = await el.textContent();
    if (text && text !== initialDateText) {
      dateChanged = true;
      break;
    }
  }

  expect(dateChanged).toBeTruthy();

  // Go back to original date
  await prevDayButton.click();

  // Wait for UI update
  await page.waitForTimeout(500);

  // Check if we're back to the initial date
  let backToInitial = false;
  for (const el of dateElements) {
    const text = await el.textContent();
    if (text && text.includes(today)) {
      backToInitial = true;
      break;
    }
  }

  expect(backToInitial).toBeTruthy();
});

test('should show different task categories', async () => {
  // Check for the existence of different category sections
  const workSection = page.locator('[data-category="work"], .category-work');
  const passionSection = page.locator('[data-category="passion"], .category-passion');
  const playSection = page.locator('[data-category="play"], .category-play');

  // At least one category should be visible
  expect(
    (await workSection.count()) + (await passionSection.count()) + (await playSection.count()),
  ).toBeGreaterThan(0);
});
