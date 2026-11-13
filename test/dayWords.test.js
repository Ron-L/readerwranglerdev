// Unit tests for the ONE day-words helper (uiHelpers.js, 7.29.1) — run: node test/dayWords.test.js
// tags: dates, restore, tier 1
// covers: uiHelpers.js
//
// TODO "Restore dialog calls yesterday's backup 'today'" (20260922-0000a): the Restore Backup box counted a backup's age
// in 24-hour blocks, so a backup from 6:54 PM yesterday read "today" until 6:54 PM today. Decided (Ron): CALENDAR days,
// local time — at 12:01 AM a backup from 11:59 PM is "yesterday" — counted through local midnights, so a 23- or 25-hour
// day at a clock change doesn't miscount. Words (Ron, 2026-11-13): today / yesterday / 2–6 days ago / 1 week ago (7–13
// days) / N weeks ago.
//
// The time zone is PINNED here (a US zone, with its clock changes) so the daylight-saving rows mean the same on every
// computer: 2026's clocks go forward on Sunday 8 March (a 23-hour day) and back on Sunday 1 November (a 25-hour day).
process.env.TZ = 'America/New_York';
const assert = require('assert');
const { calendarDaysBetween, daysAgoWords } = require('../uiHelpers.js');
const { test: t, done } = require('./harness');

// a local time: at(2026, 3, 8, 23, 15) = 8 March 2026, 11:15 PM in the pinned zone (month 1-based, as people write it)
const at = (y, mo, d, h = 12, mi = 0) => new Date(y, mo - 1, d, h, mi);

console.log('dayWords');

t('DAYS-001', 'the pinned time zone is in force (the daylight-saving rows depend on it)', () => {
    assert.strictEqual(at(2026, 3, 7).getTimezoneOffset(), 300, 'before the spring change: 5 hours behind UTC');
    assert.strictEqual(at(2026, 3, 9).getTimezoneOffset(), 240, 'after it: 4 hours behind UTC');
});

t('DAYS-002', "Ron's example: at 12:01 AM, a backup from 11:59 PM — two minutes earlier — is yesterday", () => {
    assert.strictEqual(daysAgoWords(at(2026, 9, 21, 23, 59), at(2026, 9, 22, 0, 1)), 'yesterday');
    assert.strictEqual(calendarDaysBetween(at(2026, 9, 21, 23, 59), at(2026, 9, 22, 0, 1)), 1);
});

t('DAYS-003', 'the reported case: a backup from 9/21 6:54 PM, looked at on 9/22 in the morning, is yesterday', () => {
    assert.strictEqual(daysAgoWords(at(2026, 9, 21, 18, 54), at(2026, 9, 22, 9, 30)), 'yesterday');
});

t('DAYS-004', 'the same calendar day is today, however many hours apart', () => {
    assert.strictEqual(daysAgoWords(at(2026, 9, 22, 0, 1), at(2026, 9, 22, 23, 59)), 'today');
    assert.strictEqual(daysAgoWords(at(2026, 9, 22, 9), at(2026, 9, 22, 9)), 'today');
});

t('DAYS-005', 'spring forward (a 23-hour day): 11:30 PM Saturday → 11:15 PM Sunday is yesterday, not today', () => {
    // only 22 h 45 min apart — a count in 24-hour blocks says "today"
    assert.strictEqual(daysAgoWords(at(2026, 3, 7, 23, 30), at(2026, 3, 8, 23, 15)), 'yesterday');
    assert.strictEqual(calendarDaysBetween(at(2026, 3, 7, 23, 30), at(2026, 3, 8, 23, 15)), 1);
});

t('DAYS-006', 'fall back (a 25-hour day): 12:10 AM → 11:50 PM the same Sunday is today, not yesterday', () => {
    // 24 h 40 min apart — a count in 24-hour blocks says "yesterday"
    assert.strictEqual(daysAgoWords(at(2026, 11, 1, 0, 10), at(2026, 11, 1, 23, 50)), 'today');
    assert.strictEqual(calendarDaysBetween(at(2026, 11, 1, 0, 10), at(2026, 11, 1, 23, 50)), 0);
});

t('DAYS-007', 'across a clock change, whole weeks still count as weeks', () => {
    assert.strictEqual(calendarDaysBetween(at(2026, 3, 1, 0, 30), at(2026, 3, 15, 0, 15)), 14);
    assert.strictEqual(daysAgoWords(at(2026, 3, 1, 0, 30), at(2026, 3, 15, 0, 15)), '2 weeks ago');
});

t('DAYS-008', 'the words, one row per boundary: 2–6 days ago, 1 week ago (7–13 days), N weeks ago', () => {
    const now = at(2026, 10, 31, 10);
    const rows = [[0, 'today'], [1, 'yesterday'], [2, '2 days ago'], [6, '6 days ago'], [7, '1 week ago'],
                  [13, '1 week ago'], [14, '2 weeks ago'], [20, '2 weeks ago'], [21, '3 weeks ago'], [70, '10 weeks ago']];
    for (const [days, words] of rows) {
        const then = new Date(now); then.setDate(then.getDate() - days); then.setHours(22, 0);   // late in that day
        assert.strictEqual(daysAgoWords(then, now), words, `${days} days back`);
    }
});

t('DAYS-009', 'a date after now (another computer\'s clock) reads today; no date, or a bad one, gives no words', () => {
    assert.strictEqual(daysAgoWords(at(2026, 9, 23, 8), at(2026, 9, 22, 9)), 'today');
    assert.strictEqual(daysAgoWords(null, at(2026, 9, 22)), '');
    assert.strictEqual(daysAgoWords('not a date', at(2026, 9, 22)), '');
});

t('DAYS-010', 'takes what a backup carries: a date string or a number, as well as a Date', () => {
    const then = at(2026, 9, 21, 18, 54);
    assert.strictEqual(daysAgoWords(then.toISOString(), at(2026, 9, 22, 9)), 'yesterday');
    assert.strictEqual(daysAgoWords(then.getTime(), at(2026, 9, 22, 9)), 'yesterday');
});

done();
