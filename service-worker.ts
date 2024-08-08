chrome.action.onClicked.addListener(async function () {
  let tabGrabHtml = chrome.runtime.getURL('TabGrab.html');
  console.log(tabGrabHtml);
  let tabs = await chrome.tabs.query({ url: tabGrabHtml });

  console.log(tabs);

  if (tabs.length == 0) {
    chrome.tabs.create({
      url: tabGrabHtml
    });
  }

  let tab = tabs[0];
  let tabId = tab.id;

  if (tabId == undefined) {
    return;
  }

  await chrome.tabs.update(tabId ?? 0, { active: true });
  await chrome.windows.update(tab.windowId, { focused: true });
});
