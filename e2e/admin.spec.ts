import { test, expect } from './support/seats';
import { CAST } from './support/cast';

// The admin console, from the target seat (the only admin seat with data).
//
// The read-only specs come first. The destructive ones act on the `disposable`
// seat and nothing else: disable, re-enable and expire are one-way, and doing
// them to a relationship seat would corrupt the fixture every other spec reads
// at exactly the moment a rule regressed. `task seed:dev` clears that seat's
// disabled_at every run, so a spec that fails midway self-heals.

test.describe('@authenticated admin', () => {
  test('the directory lists every account with a count', async ({ target }) => {
    await target.goto('/admin');
    const body = await target.locator('main').innerText();

    expect(body, 'the directory did not report how many users it is showing').toMatch(
      /\d+ of \d+ users/i,
    );
    await expect(target.getByText('admin-two', { exact: true }).first()).toBeVisible();
  });

  test('a non-admin account offers the impersonation control', async ({ target }) => {
    // The positive half of the pair below. Without it, the negative test
    // passes trivially if the button were renamed or removed for everyone.
    await target.goto('/admin');
    await target.getByText('follower', { exact: true }).first().click();

    await expect(
      target.getByRole('button', { name: /View as @follower/i }),
      'impersonation is missing for an ordinary user',
    ).toBeVisible();
  });

  test('an admin account does not offer impersonation of another admin', async ({ target }) => {
    // #341: an admin cannot impersonate another admin. The console enforces
    // this by not rendering the control at all, which is the right place for
    // it - the API refusing is the backstop, not the first line.
    await target.goto('/admin');
    await target.getByText('admin-two', { exact: true }).first().click();

    await expect(
      target.getByRole('button', { name: /View as/i }),
      'the console offered to impersonate another admin',
    ).toHaveCount(0);
  });

  test('the audit log renders', async ({ target }) => {
    await target.goto('/admin/audit');
    const body = await target.locator('main').innerText();
    expect(body.trim().length, 'the audit log rendered nothing').toBeGreaterThan(0);
    await expect(target.getByText(/Audit log/i).first()).toBeVisible();
  });

  test('the reports view renders', async ({ target }) => {
    await target.goto('/admin/reports');
    const body = await target.locator('main').innerText();
    expect(body.trim().length, 'reports rendered nothing').toBeGreaterThan(0);
  });

  test('a non-admin seat cannot reach the admin console', async ({ follower }) => {
    // The authorization boundary itself. Driving the console only from the
    // admin seat would never notice if this stopped being enforced.
    await follower.goto('/admin');
    const body = await follower.locator('main').innerText();
    expect(
      body,
      'a non-admin seat was shown the admin directory',
    ).not.toMatch(/\d+ of \d+ users/i);
  });

  test('an admin CAN disable an ordinary account, and re-enable it', async ({ target }) => {
    // The positive control for the rule below. Without it, the refusal test
    // passes trivially if disabling broke for everyone.
    //
    // Acts on `disposable` and only `disposable`. Leaves it enabled, and if
    // this test dies between the two halves the next `task seed:dev` puts it
    // back.
    await target.goto('/admin');
    await target.getByText(CAST.disposable.handle, { exact: true }).first().click();

    await target.getByRole('button', { name: 'Disable account' }).click();
    await target
      .getByRole('button', { name: new RegExp(`Disable @${CAST.disposable.handle}`) })
      .click();

    await expect(
      target.getByText(/disabled/i).first(),
      'the account did not report as disabled',
    ).toBeVisible({ timeout: 15_000 });

    // Re-enable, so the seat is usable without waiting for a reseed. The
    // control is named for whichever state it is in.
    const enable = target.getByRole('button', { name: /Enable account|Re-enable/i });
    await expect(enable, 'no way back from disabled in the console').toBeVisible();
    await enable.click();
    const confirm = target.getByRole('button', { name: /Enable @/ });
    if (await confirm.count()) await confirm.click();

    await expect(target.getByText(/active/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
