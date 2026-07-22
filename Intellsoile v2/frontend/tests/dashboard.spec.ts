import { test, expect } from '@playwright/test';

test.describe('IntelliSole Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to a blank page on the same domain first to set sessionStorage
        await page.goto('/');
        await page.evaluate(() => {
            sessionStorage.setItem("mock_user", JSON.stringify({
                id: "test-user-id",
                email: "test@intellisole.test",
                user_metadata: {
                    full_name: "Test Patient",
                    role: "patient"
                }
            }));
        });
        await page.goto('/dashboard');
    });

    test('should display health metrics correctly', async ({ page }) => {
        await expect(page.locator('text=Good Morning, Test')).toBeVisible();
        await expect(page.locator('text=Battery Status')).toBeVisible();
        await expect(page.locator('text=Foot Temperature')).toBeVisible();
    });

    test('should show emergency SOS button', async ({ page }) => {
        const sosButton = page.locator('button:text("EMERGENCY SOS")');
        await expect(sosButton).toBeVisible();
    });

    test('should navigate to reports page', async ({ page }) => {
        await page.click('text=Reports');
        await expect(page).toHaveURL(/\/reports/);
    });

    test('should navigate to community page', async ({ page }) => {
        await page.click('text=Community');
        await expect(page).toHaveURL(/\/community/);
    });
});
