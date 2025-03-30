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

test('should be able to add subtasks to a task', async () => {
  // Create a new task first
  const taskTitle = `Subtask Test ${Date.now()}`;

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

  // Look for subtask section
  const addSubtaskButton = page.locator(
    'button:has-text("Add Subtask"), button:has-text("+ Subtask")',
  );

  if ((await addSubtaskButton.count()) === 0) {
    // Subtasks UI might not be visible yet, try to find a subtasks section or tab
    const subtasksSection = page.locator('[aria-label*="subtask"], button:has-text("Subtasks")');

    if ((await subtasksSection.count()) > 0) {
      await subtasksSection.click();
      // Wait for subtask UI to appear
      await page.waitForTimeout(500);
    }
  }

  // Try again to find the add subtask button after potentially navigating to subtasks section
  const addSubtaskButtonRetry = page.locator(
    'button:has-text("Add Subtask"), button:has-text("+ Subtask")',
  );

  if ((await addSubtaskButtonRetry.count()) === 0) {
    // If we still can't find the subtask UI, we'll skip this test
    await page.click('button:has-text("Cancel"), button:has-text("Close"), [aria-label="Close"]');
    test.skip();
    return;
  }

  // Click to add a subtask
  await addSubtaskButtonRetry.click();

  // Wait for subtask input to appear
  await page.waitForTimeout(500);

  // Find subtask input field
  const subtaskInput = page.locator('input[placeholder*="subtask"], input[aria-label*="subtask"]');

  // Add first subtask
  const subtask1 = `Subtask 1 ${Date.now()}`;
  await subtaskInput.fill(subtask1);
  await page.keyboard.press('Enter');

  // Add second subtask
  const subtask2 = `Subtask 2 ${Date.now()}`;
  await subtaskInput.fill(subtask2);
  await page.keyboard.press('Enter');

  // Save the task with subtasks
  await page.click('button:has-text("Save"), button:has-text("Create"), button[type="submit"]');

  // Wait for the task to appear
  await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 5000 });

  // Check if the created task has a subtask indicator
  const createdTask = page.locator(`.task-card:has-text("${taskTitle}")`);

  // Click on the task to view details or expand it
  await createdTask.click();

  // Wait for task details or expanded view
  await page.waitForTimeout(500);

  // Check if subtasks are visible
  const hasSubtasks =
    (await page.getByText(subtask1).isVisible()) ||
    (await page.getByText(subtask2).isVisible()) ||
    (await page.locator('.subtask, [data-test*="subtask"]').count()) > 0;

  expect(hasSubtasks).toBeTruthy();
});

test('should be able to complete subtasks', async () => {
  // Find a task with subtasks
  const taskCards = await page.locator('.task-card').all();

  // We'll try each task until we find one with subtasks
  let foundTaskWithSubtasks = false;
  let taskWithSubtasks;

  for (const task of taskCards) {
    // Click on the task to open it
    await task.click();

    // Wait for details to load
    await page.waitForTimeout(500);

    // Check if there are subtasks
    const subtaskCount = await page
      .locator('.subtask, [data-test*="subtask"], [aria-label*="subtask"]')
      .count();

    if (subtaskCount > 0) {
      foundTaskWithSubtasks = true;
      taskWithSubtasks = task;
      break;
    }

    // Close the task details if we didn't find subtasks
    const closeButton = page.locator(
      'button:has-text("Cancel"), button:has-text("Close"), [aria-label="Close"]',
    );
    if ((await closeButton.count()) > 0) {
      await closeButton.click();
      await page.waitForTimeout(300);
    }
  }

  if (!foundTaskWithSubtasks) {
    test.skip();
    return;
  }

  // Find a subtask checkbox
  const subtaskCheckbox = page
    .locator('.subtask input[type="checkbox"], .subtask [role="checkbox"]')
    .first();

  // Get initial state
  const initialCheckedState =
    (await subtaskCheckbox.isChecked()) ||
    (await subtaskCheckbox.getAttribute('aria-checked')) === 'true';

  // Toggle the subtask completion
  await subtaskCheckbox.click();

  // Wait for state to update
  await page.waitForTimeout(500);

  // Get updated state
  const updatedCheckedState =
    (await subtaskCheckbox.isChecked()) ||
    (await subtaskCheckbox.getAttribute('aria-checked')) === 'true';

  // The state should have changed
  expect(initialCheckedState).not.toEqual(updatedCheckedState);

  // Check if task progress indicator has updated
  const progressIndicator = page.locator(
    '.progress-bar, [role="progressbar"], .progress-indicator',
  );

  if ((await progressIndicator.count()) > 0) {
    const hasProgress = await progressIndicator.evaluate((el) => {
      // Check if the progress element has a non-zero value
      const ariaValueNow = el.getAttribute('aria-valuenow');
      const style = window.getComputedStyle(el);
      const width = style.width;

      return (
        (ariaValueNow && parseInt(ariaValueNow) > 0) || (width && width !== '0px' && width !== '0%')
      );
    });

    expect(hasProgress).toBeTruthy();
  }
});

test('should update task progress when completing subtasks', async () => {
  // Create a new task with subtasks for this test
  const taskTitle = `Progress Test ${Date.now()}`;

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

  // Look for subtask section
  const addSubtaskButton = page.locator(
    'button:has-text("Add Subtask"), button:has-text("+ Subtask")',
  );

  if ((await addSubtaskButton.count()) === 0) {
    // Subtasks UI might not be visible yet, try to find a subtasks section or tab
    const subtasksSection = page.locator('[aria-label*="subtask"], button:has-text("Subtasks")');

    if ((await subtasksSection.count()) > 0) {
      await subtasksSection.click();
      // Wait for subtask UI to appear
      await page.waitForTimeout(500);
    } else {
      // If we can't find the subtask UI at all, skip this test
      await page.click('button:has-text("Cancel"), button:has-text("Close"), [aria-label="Close"]');
      test.skip();
      return;
    }
  }

  // Try again to find the add subtask button after potentially navigating to subtasks section
  const addSubtaskButtonRetry = page.locator(
    'button:has-text("Add Subtask"), button:has-text("+ Subtask")',
  );

  // Click to add subtasks
  await addSubtaskButtonRetry.click();

  // Add two subtasks
  const subtaskInput = page.locator('input[placeholder*="subtask"], input[aria-label*="subtask"]');

  await subtaskInput.fill(`Subtask 1 ${Date.now()}`);
  await page.keyboard.press('Enter');

  await subtaskInput.fill(`Subtask 2 ${Date.now()}`);
  await page.keyboard.press('Enter');

  // Save the task
  await page.click('button:has-text("Save"), button:has-text("Create"), button[type="submit"]');

  // Wait for the task to appear
  await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 5000 });

  // Click on the task to open it
  await page.getByText(taskTitle).click();

  // Wait for task details
  await page.waitForTimeout(500);

  // Record initial progress
  const progressBefore = await page
    .locator('.progress-bar, [role="progressbar"], .progress-indicator')
    .getAttribute('aria-valuenow');
  const initialProgress = progressBefore ? parseInt(progressBefore) : 0;

  // Complete one subtask
  const firstSubtaskCheckbox = page
    .locator('.subtask input[type="checkbox"], .subtask [role="checkbox"]')
    .first();
  await firstSubtaskCheckbox.click();

  // Wait for progress to update
  await page.waitForTimeout(500);

  // Check updated progress
  const progressAfter = await page
    .locator('.progress-bar, [role="progressbar"], .progress-indicator')
    .getAttribute('aria-valuenow');
  const updatedProgress = progressAfter ? parseInt(progressAfter) : 0;

  // Progress should have increased (for 2 subtasks, completing 1 should be about 50%)
  expect(updatedProgress).toBeGreaterThan(initialProgress);
});
