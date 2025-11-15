# TEST RIGHT NOW

## Step 1: Check Service Worker Console

1. Go to `chrome://extensions/`
2. Find **Privacy Guard**
3. Click **"service worker"** (blue link)
4. **Copy EVERYTHING you see** - especially any red errors

## Step 2: Test Connection

In the service worker console (the one that opened), paste this:

```javascript
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('TEST LISTENER GOT:', msg);
  sendResponse({ success: true, test: 'manual test works' });
  return true;
});
console.log('Manual test listener added');
```

Then in the popup console (right-click extension icon → Inspect popup), run:

```javascript
chrome.runtime.sendMessage({ type: 'MANUAL_TEST' }, (r) => {
  console.log('POPUP GOT RESPONSE:', r);
  if (chrome.runtime.lastError) {
    console.error('ERROR:', chrome.runtime.lastError);
  }
});
```

## Step 3: Share Results

Please tell me:
1. **What errors** you see in service worker console
2. **What happens** when you run the test above
3. **What error message** appears when you click buttons in the popup

This will tell me exactly what's broken.

