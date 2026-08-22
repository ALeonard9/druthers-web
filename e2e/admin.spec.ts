import { test, expect } from './support/seats';

// The admin console, from the target seat (the only admin seat with data).
//
// Everything here is READ-ONLY on purpose. The destructive controls in this
// console act on the seeded cast: disabling `admin-two` to prove it is refused
// would break every later run if the rule ever regressed, which is the exact
// case the test exists to detect. Those need a throwaway account, not a cast
// member, and are deliberately left for a spec that creates its own subject.

test.describe('@authenticated admin', () => {
  test('the directory lists every account with a count', async ({ target }) => {
    await target.goto('/admin');
    const body = await target.locator('main').innerText();

    expect(body, 'the directory did not report how many users it is showing').toMatch(
      /\d+ of \d+ users/i,
    );
    // Assert on a seat that exists in every environment. `admin-two` is
    // opt-in on QA, so asserting it here would fail for a configuration
    // choice rather than a broken directory.
    await expect(target.getByText('follower', { exact: true }).first()).toBeVisible();
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
    // Needs a SECOND admin. On QA `admin-two` is seeded only when
    // QA_ADMIN_TWO_PASSWORD is set, because an admin seat with a shared known
    // password on an internet-facing host holding prod-derived data is a
    // different proposition from one on a local database. Skip rather than
    // fail where the seat is absent: the rule is covered locally.
    await target.goto('/admin');
    const present = await target.getByText('admin-two', { exact: true }).count();
    test.skip(present === 0, 'admin-two is not seeded in this environment');

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
});
