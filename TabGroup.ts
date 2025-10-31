class TabGroup {
    constructor(windowId: number, windowLabel: string, tabs: chrome.tabs.Tab[]) {
        this.windowId = windowId;
        this.windowLabel = windowLabel;
        this.tabs = tabs;
    }

    windowId: number;
    windowLabel: string;
    tabs: chrome.tabs.Tab[];
}

var youtube = false;

async function GetTabs() {
    const currentWindowTab = await chrome.tabs.query({ currentWindow: true });
    const otherWindowsTabs = await chrome.tabs.query({ currentWindow: false });
    const tabs = currentWindowTab.concat(otherWindowsTabs);
    return tabs;
}

async function ListTabs() {
    const tabs = await GetTabs();
    const urlCount: Record<string, number> = {}
    const tabGroups = new Map<number, TabGroup>()
    const youtubes = new TabGroup(141412412, "YouTubes", [])

    for (const tab of tabs) {
        if (!tabGroups.has(tab.windowId)) {
            tabGroups.set(tab.windowId, new TabGroup(tab.windowId, "{undefined}", []))
        }

        if (tab.url) {
            const count = urlCount[tab.url] + 1
            urlCount[tab.url] = count
            let idx = tab.url.indexOf('youtube.com')
            if (idx >= 0) {
                youtubes.tabs.push(tab)
            }
        }

        let current = tabGroups.get(tab.windowId);
        if (!current) {
            continue;
        }
        current.tabs.push(tab);
    }

    tabGroups.set(youtubes.windowId, youtubes)

    const windows = Array.from(tabGroups).map(([_, tg]) => tg)

    return windows;
}

async function SelectYouTube() {
    youtube = !youtube;
    RefreshTabs();
}

async function RefreshTabs() {
    const tabGroups = await ListTabs();
    let root = div({ class: "columns" });
    let tabDiff = 0;

    root.append(resetButton());

    let columnLeft = div({ class: "column" });
    let columnRight = div({ class: "column" });

    for (const tabGroup of tabGroups) {
        // root.append(
        //     div({ class: "column" },
        //         ...(tabGroup.tabs.map(t => tabComponent(t)))
        //     ))

        let isYoutubes = tabGroup.windowLabel == "YouTubes";

        if ((isYoutubes && !youtube) || (!isYoutubes && youtube)) {
            continue;
        }

        let tabGroupDiv = div({ class: "tab-group" }, ...(tabGroup.tabs.map(t => tabComponent(t))))

        if (tabDiff < 0) {
            tabDiff += (tabGroup.tabs.length + 1);

            columnRight.append(tabGroupDiv);
        } else {
            tabDiff -= (tabGroup.tabs.length + 1);

            columnLeft.append(tabGroupDiv);
        }
    }

    root.append(columnLeft, columnRight);

    document.body.replaceChildren(root)
    // console.log("RefreshTabs()")
}

async function TabClick(windowId?: number, tabId?: number, ev?: MouseEvent) {
    switch (ev?.button) {
        case 0:
            await JumpToTab(windowId, tabId);
            break;
        case 4:
            await CloseTab(tabId);
            break;
        default:
            break;
    }
}

async function JumpToTab(windowId?: number, tabId?: number): Promise<void> {
    if (!windowId) return;
    if (!tabId) return;

    await chrome.tabs.update(tabId, { active: true });
    await chrome.windows.update(windowId, { focused: true });
}

async function CloseTab(tabId?: number) {
    if (!tabId) {
        return;
    }

    await chrome.tabs.remove(tabId);
    RefreshTabs();
}

function resetButton() {
    return (
        div({ class: "toolbar" },
            button({ onclick: RefreshTabs },
                document.createTextNode("refresh")
            ),
            button({ onclick: SelectYouTube },
                document.createTextNode(youtube ? "switch to all" : "switch to youtube")
            )
        )
    )
}

function tabComponent(tab: chrome.tabs.Tab) {
    return (
        div({ class: "tab-box" },
            div({ style: `background-image: url('${tab.favIconUrl}')`, class: "btn-link favicon" }),
            div({ style: "display: inline-block", class: "tab-title", onclick: (ev) => TabClick(tab.windowId, tab.id, ev) },
                document.createTextNode(tab.title ?? tab.id?.toString() ?? "{oops}")),
            // img({ alt: "(jump to tab)", src: "img/jump-link.svg", class: "btn-link jump-to-tab", onclick: () => JumpToTab(tab.windowId, tab.id) }),
            div({ class: "btn-link close-tab", onclick: () => CloseTab(tab.id) }),
            // a({ href: tab.url },
            //     document.createTextNode(tab.title ?? tab.id?.toString() ?? "{oops}"))
        )
    )
}

chrome.runtime.onMessage.addListener(async function (message, sender, sendResponse) {
    if (message == "RefreshTabs") {
        RefreshTabs();
    }
});

RefreshTabs();
