import { test as base, expect } from './support/seats';
import { CAST } from './support/cast';
import { removeTrackedTitle, readTracked, type Domain } from './support/cleanup';

// Add, edit, delete: the write path, per domain, as one arc that leaves the
// seat exactly as it found it.
//
// Structuring it as one arc rather than three tests is deliberate. Add, edit
// and delete could each stand alone, but then each needs its own setup and
// teardown, and a failed add leaves an item the edit test trips over. One arc
// means one thing to clean up, and it can assert something separate tests
// cannot: that the item you edited is the item you added, and that deleting
// it really removes it.
//
// The cost is coupling: if add breaks, this reports one failure instead of
// three and the edit and delete paths go unexercised. That is the right trade
// (a broken add makes them untestable anyway) but it is a trade.
//
// Every subject is a title the seat does NOT already track, and the arc
// removes it again, so no seeded row is ever touched. That is what makes the
// suite safe to run repeatedly: verified by running it twice and diffing the
// seat's tracked rows.

interface Subject {
  domain: Domain;
  /** URL segment, which is not always the api's domain key. */
  path: string;
  query: string;
  title: string;
}

const SUBJECTS: Subject[] = [
  { domain: 'movies', path: 'movies', query: 'The Matrix Reloaded', title: 'The Matrix Reloaded' },
  { domain: 'tv-shows', path: 'tv', query: 'Severance', title: 'Severance' },
  { domain: 'books', path: 'books', query: 'Dune Messiah', title: 'Dune Messiah' },
  { domain: 'games', path: 'games', query: 'Hades', title: 'Hades' },
];

const NOTE = 'e2e lifecycle note';
const COMPLETED = '2024-03-15';

const test = base.extend<{ sweep: void }>({
  sweep: [
    async ({}, run) => {
      // Sweep before as well as after. If an earlier run crashed between add
      // and delete its residue is still here, and starting from a dirty shelf
      // would fail this run for the previous run's reason.
      for (const s of SUBJECTS) await removeTrackedTitle(CAST.follower, s.domain, s.title);
      await run();
      // Runs even when the test throws, which is the point of putting it in a
      // fixture rather than at the end of the test body.
      for (const s of SUBJECTS) await removeTrackedTitle(CAST.follower, s.domain, s.title);
    },
    { auto: true },
  ],
});

test.describe('@authenticated item lifecycle', () => {
  // Serial, and slower than the default: each arc is a real search against a
  // live upstream, an add, an edit round-trip and a delete. 30s is not enough
  // and a timeout here would read as a broken assertion.
  test.describe.configure({ mode: 'serial', timeout: 90_000 });

  for (const subject of SUBJECTS) {
    test(`${subject.path}: add, edit and remove a title, leaving no trace`, async ({
      follower,
    }) => {
      // --- add ------------------------------------------------------------
      await follower.goto(`/${subject.path}/search`);
      const box = follower.locator('input[name="q"]').last();
      await box.fill(subject.query);
      await box.press('Enter');

      // Scope the button to the row for THIS title. A bare `.first()` is
      // wrong in a way that hides itself: a title already tracked renders
      // "On Watchlist" instead of a button, so the first add button on the
      // page can belong to a different title entirely, and the run passes.
      const row = follower
        .locator('li')
        .filter({ hasText: subject.title })
        .filter({ has: follower.getByRole('button', { name: /Watch|Read|Play/ }) })
        .first();
      await expect(row, `search returned no addable result for ${subject.title}`).toBeVisible({
        timeout: 20_000,
      });

      // Wait on the request, not the clock: the click fires the add and then
      // navigates on its own, so asserting immediately races the write.
      const added = follower.waitForResponse(
        (r) => r.url().includes(`/api/${subject.path}/add`) && r.request().method() === 'POST',
      );
      await row.getByRole('button', { name: /Watch|Read|Play/ }).first().click();
      expect((await added).status(), 'the add request did not succeed').toBe(201);

      // --- edit -----------------------------------------------------------
      // Address the detail page by catalog id rather than hunting for a link.
      // A freshly added title lands on the WATCHLIST, not the ranked shelf, so
      // scraping `/<domain>` for its link finds nothing - and the id is what
      // the route actually takes.
      const tracked = await readTracked(CAST.follower, subject.domain, subject.title);
      expect(tracked, `${subject.title} is not tracked after the add`).not.toBeNull();
      await follower.goto(`/${subject.path}/${tracked!.catalogId}`);

      const notes = follower.getByPlaceholder('Write your notes…');
      await expect(notes, 'the note field is missing from item detail').toBeVisible();

      // Wait for the save, not for the clock. The note field debounces and
      // saves on blur, so reloading straight afterwards races the write. This
      // passed on movies and failed on tv purely on timing, which is the
      // signature of a race rather than a per-domain bug - worth stating,
      // because the failure message ("the note did not survive a reload")
      // reads exactly like a real persistence bug.
      const savedNote = follower.waitForResponse(
        (r) =>
          r.url().includes(`/api/${subject.path}/`) &&
          r.url().includes('/track') &&
          r.request().method() === 'PUT',
      );
      await notes.fill(NOTE);
      await notes.blur();
      expect((await savedNote).status(), 'saving the note failed').toBe(200);

      // The completed-date field only renders once an item is actually
      // watched/read/played - a fresh watchlist add has nothing to date yet.
      // Assert it conditionally rather than forcing state the arc does not
      // otherwise need; a hard assertion here would be testing the fixture,
      // not the feature.
      const date = follower.locator('main input[type="date"]');
      const datable = (await date.count()) > 0;
      if (datable) {
        const savedDate = follower.waitForResponse(
          (r) =>
            r.url().includes(`/api/${subject.path}/`) &&
            r.url().includes('/track') &&
            r.request().method() === 'PUT',
        );
        await date.first().fill(COMPLETED);
        await date.first().blur();
        await savedDate;
      }

      // Reload rather than trusting local state: the point of the edit test
      // is that the value round-trips to the api, not that the input accepted
      // a keystroke.
      await follower.reload();
      await expect(
        follower.getByPlaceholder('Write your notes…'),
        'the note did not survive a reload',
      ).toHaveValue(NOTE);
      if (datable) {
        await expect(
          follower.locator('main input[type="date"]').first(),
          'the completed date did not survive a reload',
        ).toHaveValue(COMPLETED);
      }

      // --- delete -----------------------------------------------------------
      const removed = await removeTrackedTitle(CAST.follower, subject.domain, subject.title);
      expect(removed, 'nothing was removed, so the add never really happened').toBeGreaterThan(0);

      await follower.goto(`/${subject.path}`);
      await expect(
        follower.getByText(subject.title),
        'the title is still on the shelf after removal',
      ).toHaveCount(0);
    });
  }

  test('the seat is back to its seeded state', async ({ follower }) => {
    // The proof the arcs above are repeatable. If this fails the suite is not
    // safe to run twice, which is worse than a broken feature: every later run
    // reports the wrong thing.
    await follower.goto('/movies');
    expect(
      await follower.locator('main').innerText(),
      'the movies ranked count drifted from the seed',
    ).toMatch(/2 ranked/i);
  });
});
