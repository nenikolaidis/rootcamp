// SPDX-License-Identifier: AGPL-3.0-or-later
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('RootCamp');
  await expect(page.getByRole('heading', { level: 1, name: 'RootCamp' })).toBeVisible();
});

test('home page has no WCAG 2.2 AA violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});

test('unknown routes fall back to the app shell', async ({ page }) => {
  await page.goto('/islands/raid-rock');
  await expect(page.getByRole('heading', { level: 1, name: 'RootCamp' })).toBeVisible();
});
