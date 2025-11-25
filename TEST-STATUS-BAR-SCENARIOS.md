# Status Bar Test Scenarios

**Version**: v3.7.0
**Purpose**: Representative coverage of status bar behavior across key states

---

## Test Environment Setup

**Prerequisites:**
- ReaderWrangler app loaded in browser
- DevTools Console open (F12) for IndexedDB inspection
- Access to Amazon account for fetcher scripts

**IndexedDB Inspection:**
```
Application tab → IndexedDB → ReaderWranglerManifests → manifests
```

**localStorage Inspection:**
```
Application tab → Local Storage → readerwrangler-status
```

---

## Scenario 1: Fresh Start (Empty/Empty)

**Starting State:**
- Clear browser data (IndexedDB + localStorage) for the site
- OR use "Clear Everything" button in app

**Expected Status Bar:**
- Icon: 🛑
- Tooltip: "Please click to see required action(s)"

**Expected Dialog:**
- Shows "Fetch Library" button prominently
- Library Fetch: Unknown, Load: Missing
- Collections Fetch: Unknown, Load: Missing

**Actions to Test:**
1. Hover over status icon → verify tooltip
2. Click status icon → verify dialog content
3. Verify "Fetch Library" button opens amazon.com/yourbooks in new tab

---

## Scenario 2: After Fresh Fetch + Load (Fresh/Fresh)

**Starting State:**
- Run library fetcher on Amazon (creates IndexedDB manifest with GUID)
- Load the downloaded JSON file into app

**Expected Status Bar:**
- Icon: ✅
- Tooltip: "No actions required"

**Expected Dialog:**
- Shows "Everything is up to date!" message
- Library Fetch: Fresh (Xh), Load: Fresh (Xh)
- Collections Fetch: Unknown, Load: Unknown (not loaded yet)

**Verification:**
1. Check IndexedDB has manifest with matching GUID
2. Check localStorage has libraryStatus with same GUID
3. Verify times shown are accurate

---

## Scenario 3: Loaded Data Without Manifest (Unknown Fetch)

**Starting State:**
- Clear IndexedDB manifests only (keep library loaded in app)
- OR load a legacy JSON file (pre-GUID, no metadata.fetchDate)

**Expected Status Bar:**
- Icon: ✅ (if data is recent) OR ❓ (if legacy file)

**For Recent Data (has fetchDate but no manifest):**
- Urgency based on Load state only
- Dialog shows "Fetch status unknown (no DB manifest)"

**For Legacy File (no fetchDate):**
- Icon: ❓
- Dialog shows "Your library file doesn't have date tracking metadata"

---

## Scenario 4: Stale Loaded Data (Any Fetch / Stale Load)

**Starting State:**
- Modify localStorage `readerwrangler-status` to have old fetchDate
- Set `libraryStatus.loadedFetchDate` to 15 days ago

**Expected Status Bar:**
- Icon: ⚠️
- Tooltip: "Please click to see suggested action(s)"

**Expected Dialog:**
- Recommends re-fetching or reloading
- Shows Load: Stale (15d)

**How to Simulate:**
```javascript
// In DevTools Console
const status = JSON.parse(localStorage.getItem('readerwrangler-status'));
const staleDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
status.libraryStatus.loadedFetchDate = staleDate;
localStorage.setItem('readerwrangler-status', JSON.stringify(status));
// Refresh page
```

---

## Scenario 5: Obsolete Loaded Data (Any Fetch / Obsolete Load)

**Starting State:**
- Modify localStorage to have very old fetchDate (>30 days)

**Expected Status Bar:**
- Icon: 🛑
- Tooltip: "Please click to see required action(s)"

**How to Simulate:**
```javascript
const status = JSON.parse(localStorage.getItem('readerwrangler-status'));
const obsoleteDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();
status.libraryStatus.loadedFetchDate = obsoleteDate;
localStorage.setItem('readerwrangler-status', JSON.stringify(status));
// Refresh page
```

---

## Scenario 6: Fresh Fetch Available, Stale Load (Fresh/Stale)

**Starting State:**
- Have stale data loaded (15+ days old)
- Run fetcher to create fresh manifest in IndexedDB

**Expected Status Bar:**
- Icon: ⚠️ (based on Load state, not Fetch)

**Expected Dialog:**
- Shows "Load Library" button (fresh file available)
- Fetch: Fresh, Load: Stale

**Key Insight:** Urgency is ⚠️ not ✅ because what's IN the app is stale, even though a fresh file exists.

---

## Scenario 7: Combined Library + Collections Urgency

**Starting State:**
- Library: Fresh/Fresh (✅)
- Collections: Not loaded (Unknown/Empty)

**Expected Status Bar:**
- Icon: 🛑 (worst-case wins)

**Verification:**
- Dialog should show Library is fine
- Dialog should emphasize Collections needs attention
- "Collections is optional" messaging

---

## Scenario 8: Persistence Across Refresh

**Starting State:**
- Load library, verify ✅ status
- Close tab completely
- Reopen app

**Expected:**
- Status should restore from localStorage
- Same icon and state as before close
- No need to reload JSON file

**Verification:**
1. Note the status before closing
2. Close and reopen
3. Verify same status displays immediately

---

## Scenario 9: Clear Everything Resets Status

**Starting State:**
- Have library loaded with ✅ status

**Action:**
- Click "Clear Everything" button

**Expected:**
- Status resets to 🛑 (Empty/Empty)
- localStorage status cleared
- IndexedDB manifests preserved (they're from fetcher, not app)

---

## Scenario 10: GUID Mismatch (Graceful Degradation)

**Starting State:**
- Load a library JSON file
- Manually modify IndexedDB manifest to have different GUID

**Expected:**
- App falls back to Load-state-only
- Fetch shows as "Unknown" in dialog
- Urgency still based on Load state

**How to Simulate:**
```javascript
// In DevTools Console - IndexedDB
// Modify the manifest's guid to something different than loaded JSON
```

---

## Freshness Threshold Reference

| Status | Age |
|--------|-----|
| Fresh | < 7 days |
| Stale | 7-30 days |
| Obsolete | > 30 days |

---

## Quick Smoke Test (5 minutes)

1. **Clear Everything** → Verify 🛑
2. **Load a library file** → Verify icon changes (✅ if recent, ⚠️ if old)
3. **Click status icon** → Verify dialog opens with correct info
4. **Hover status icon** → Verify tooltip appears
5. **Refresh page** → Verify status persists

---

## Known Limitations

1. **Can't easily test 7+ day scenarios** without time manipulation
2. **Collections status** requires separate collections fetcher + load
3. **IndexedDB inspection** requires DevTools (not user-facing)
4. **Legacy file testing** requires a pre-v3.4.0 JSON file

---

## Bug to Watch For

**Issue 8b from TODO.md:**
> Invalid File Selection Causes Status Timeout
> When user selects wrong JSON file in Load Library dialog, status check hangs

**Test:** Try loading a non-library JSON file and verify behavior.
