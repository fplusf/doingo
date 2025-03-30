import { _electron as electron, ElectronApplication, expect, Page, test } from '@playwright/test';
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

test('should be able to focus on a task', async () => {
  // First create a new task to ensure we have something to focus on
  const taskTitle = `Focus Test Task ${Date.now()}`;

  // Look for the "Add Task" button
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

  // Find our newly created task
  const newTask = page.getByText(taskTitle).first();

  // Right-click to open context menu (or find focus button)
  const focusButton = page.locator('button:has-text("Focus"), [aria-label*="focus"]').first();

  if ((await focusButton.count()) > 0) {
    // Click the focus button if it exists
    await focusButton.click();
  } else {
    // Try right-clicking to see if there's a context menu with a focus option
    await newTask.click({ button: 'right' });

    // Check if a context menu appears
    const contextMenu = page.locator('[role="menu"]');
    if ((await contextMenu.count()) > 0) {
      // Look for focus option in the context menu
      const focusOption = contextMenu.locator('text=Focus, button:has-text("Focus")');
      if ((await focusOption.count()) > 0) {
        await focusOption.click();
      }
    }
  }

  // Wait for the task to show focused state (could be a special background, border, or icon)
  // Look for visual indicators of focus state
  await page.waitForTimeout(500);

  // Check for any focus indicators - this will vary based on the application's implementation
  const taskCard = page.locator(`.task-card:has-text("${taskTitle}")`);

  // Check various attributes that might indicate focus state
  const isFocused = await taskCard.evaluate((el) => {
    // Check for focus class, attribute, or style
    return (
      el.classList.contains('focused') ||
      el.hasAttribute('data-focused') ||
      el.getAttribute('aria-selected') === 'true' ||
      el.style.background.includes('gradient') ||
      el.querySelector('.focus-indicator') !== null
    );
  });

  expect(isFocused).toBeTruthy();
});

test('should show task details page', async () => {
  // Get task-card elements
  const taskCards = await page.locator('.task-card').all();

  if (taskCards.length === 0) {
    test.skip();
    return;
  }

  // Find a task's details button or right-click for context menu
  const firstTask = taskCards[0];
  const detailsButton = await firstTask
    .locator('button:has-text("Details"), [aria-label*="details"]')
    .first();

  if ((await detailsButton.count()) > 0) {
    // Click details button if it exists
    await detailsButton.click();
  } else {
    // Click the task itself which should navigate to details
    await firstTask.click();

    // If a form or dialog appears instead of navigating, we need to find a way to get to details
    const form = page.locator('form, [role="dialog"]');
    if ((await form.count()) > 0) {
      // Look for a "Details" or "View" button in the form
      const viewDetailsButton = form.locator('button:has-text("Details"), button:has-text("View")');
      if ((await viewDetailsButton.count()) > 0) {
        await viewDetailsButton.click();
      } else {
        // Close the form and try right-clicking for context menu
        const closeButton = form.locator(
          'button:has-text("Cancel"), button:has-text("Close"), [aria-label="Close"]',
        );
        if ((await closeButton.count()) > 0) {
          await closeButton.click();
          await page.waitForTimeout(500);

          // Right-click for context menu
          await firstTask.click({ button: 'right' });

          // Check for details option in context menu
          const contextMenu = page.locator('[role="menu"]');
          if ((await contextMenu.count()) > 0) {
            const detailsOption = contextMenu.locator('text=Details, text=View');
            if ((await detailsOption.count()) > 0) {
              await detailsOption.click();
            }
          }
        }
      }
    }
  }

  // Wait for task details page to load
  await page.waitForTimeout(1000);

  // Check for task details content
  const detailsPage = page.locator('.task-details, [data-test="task-details"]');

  // Check if we're on a details page
  const isDetailsPage =
    (await detailsPage.count()) > 0 ||
    (await page
      .locator('h1, h2, h3')
      .filter({ hasText: /Task Details|Details/i })
      .count()) > 0;

  expect(isDetailsPage).toBeTruthy();
});

test('should have task prioritization functionality', async () => {
  // Get task-card elements
  const taskCards = await page.locator('.task-card').all();

  if (taskCards.length === 0) {
    test.skip();
    return;
  }

  // Select the first task
  const firstTask = taskCards[0];

  // Click on it to open the editor
  await firstTask.click();

  // Wait for the form to appear
  await page.waitForSelector('form, [role="dialog"]');

  // Look for priority selector
  const prioritySelector = page.locator(
    'select[name="priority"], [aria-label*="priority"], [data-test*="priority"]',
  );

  if ((await prioritySelector.count()) === 0) {
    // Try looking for priority buttons/options
    const priorityButtons = page.locator(
      'button:has-text("High"), button:has-text("Medium"), button:has-text("Low")',
    );

    if ((await priorityButtons.count()) === 0) {
      test.skip();
      return;
    }

    // Click on "High" priority
    await page.locator('button:has-text("High")').click();
  } else {
    // Use the select element
    await prioritySelector.selectOption('high');
  }

  // Save the task
  await page.click('button:has-text("Save"), button:has-text("Update"), button[type="submit"]');

  // Wait for the update to take effect
  await page.waitForTimeout(500);

  // Check if the task now has a high priority indicator
  const updatedTask = page.locator('.task-card').first();
  const hasPriorityIndicator = await updatedTask.evaluate((el) => {
    return (
      el.classList.contains('priority-high') ||
      (el.hasAttribute('data-priority') && el.getAttribute('data-priority') === 'high') ||
      el.querySelector('.priority-indicator, .high-priority') !== null
    );
  });

  expect(hasPriorityIndicator).toBeTruthy();
});
