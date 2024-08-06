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

async function GetTabs() {
    const currentWindowTab = await chrome.tabs.query({ currentWindow: true });
    const otherWindowsTabs = await chrome.tabs.query({ currentWindow: false });
    const tabs = currentWindowTab.concat(otherWindowsTabs);
    return tabs;
}

async function ListTabs() {
    const tabs = await GetTabs();
    const tabGroups = new Map<number, TabGroup>()

    for (const tab of tabs) {
        if (!tabGroups.has(tab.windowId)) {
            tabGroups.set(tab.windowId, new TabGroup(tab.windowId, "{undefined}", []))
        }

        let current = tabGroups.get(tab.windowId);
        if (!current) {
            continue;
        }
        current.tabs.push(tab);
    }

    const windows = Array.from(tabGroups).map(([_, tg]) => tg)

    return windows;
}

async function RefreshTabs() {
    const tabGroups = await ListTabs();
    let root = div({ class: "columns" });

    root.append(resetButton());

    for (const tabGroup of tabGroups) {
        root.append(
            div({ class: "column" },
                h1(`${tabGroup.windowLabel} ${tabGroup.windowId}`),
                ...(tabGroup.tabs.map(t => tabComponent(t)))
            ))
    }

    document.body.replaceChildren(root)
    console.log("RefreshTabs()")
}

async function JumpToTab(windowId?: number, tabId?: number) {
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
            )
        )
    )
}

function tabComponent(tab: chrome.tabs.Tab) {
    return (
        div({ class: "tab-box" },
            img({ alt: "(close tab)", src: "img/x-circle-close-delete.svg", class: "btn-link", onclick: () => CloseTab(tab.id) }),
            img({ alt: "(jump to tab)", src: "img/jump-link.svg", class: "btn-link", onclick: () => JumpToTab(tab.windowId, tab.id) }),
            div({ style: `background-image: url('${tab.favIconUrl}')`, class: "btn-link" }),
            a({ href: tab.url },
                document.createTextNode(tab.title ?? tab.id?.toString() ?? "{oops}"))
        )
    )
}

function a(attribs: AAttribs, child?: Node) {
    const e = document.createElement("a")
    Object.entries(attribs).forEach(([name, value]) => e.setAttribute(name, value));
    if (child) {
        e.appendChild(child)
    }
    return e;
}

function button(attribs: ButtonAttribs, ...children: Node[]) {
    const e = document.createElement("button")
    Object.entries(attribs).filter(([name, v]) => name != "onclick").forEach(([name, value]) => e.setAttribute(name, value));
    if (attribs.onclick) {
        e.onclick = attribs.onclick
    }
    children.forEach(c => { e.appendChild(c); e.append(" "); });
    return e;
}

function h1(text: string) {
    const h = document.createElement("H1");
    h.appendChild(document.createTextNode(text));
    return h;
}

function img(attribs: ImgAttribs) {
    const e = document.createElement("img");
    Object.entries(attribs).filter(([name, v]) => name != "onclick").forEach(([name, value]) => e.setAttribute(name, value));
    if (attribs.onclick) {
        e.onclick = attribs.onclick
    }
    return e;
}

function div(attribs: DivAttribs, ...children: HTMLElement[]) {
    const e = document.createElement("div");
    Object.entries(attribs).forEach(([name, value]) => e.setAttribute(name, value));
    children.forEach(c => { e.appendChild(c); e.append(" "); });
    return e;
}

class ButtonAttribs {
    onclick?: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null;
}

class DivAttribs {
    class?: string;
    style?: string;
}

class ImgAttribs {
    alt?: string;
    src?: string;
    class?: string;
    style?: string;
    onclick?: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null;
}

class AAttribs {
    href?: string;
}

RefreshTabs();
