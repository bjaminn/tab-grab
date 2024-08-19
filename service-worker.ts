chrome.action.onClicked.addListener(async function () {
  let { tabs, tabGrabHtml } = await GetTabGrabHtmlTab();

  console.log(tabs);

  if (tabs.length == 0) {
    chrome.tabs.create({
      url: tabGrabHtml
    });
  }

  console.log(tabs);
  let tab = tabs[0];
  console.log(tab);
  let tabId = tab.id;
  console.log(tabId);

  if (tabId == undefined) {
    return;
  }

  await chrome.tabs.update(tabId ?? 0, { active: true });
  await chrome.windows.update(tab.windowId, { focused: true });
});

chrome.tabs.onCreated.addListener(async function (tab) {
  // console.log("created tab");
  // console.log(tab);
  await SendRefreshMessage();
})

chrome.tabs.onRemoved.addListener(async function (tabId, tabRemoveInfo) {
  // console.log("removed tab");
  // console.log(tabRemoveInfo);
  await SendRefreshMessage();
})

async function GetTabGrabHtmlTab() {
  let tabGrabHtml = chrome.runtime.getURL('TabGrab.html');
  // console.log(tabGrabHtml);
  let tabs = await chrome.tabs.query({ url: tabGrabHtml });
  return { tabs, tabGrabHtml };
}

async function SendRefreshMessage() {
  let { tabs, tabGrabHtml } = await GetTabGrabHtmlTab();

  if (tabs.length != 1) {
    return;
  }

  let grabTab = tabs[0];
  let grabTabId = grabTab.id;

  if (!grabTabId) {
    return;
  }
  chrome.tabs.sendMessage(grabTabId, "RefreshTabs");
}