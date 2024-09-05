function a(attribs: AAttribs, child: Node) { return createSingle("a", attribs, child); }

function button(attribs: ButtonAttribs, ...children: Node[]) { return createSingle("button", attribs, ...children); }

function div(attribs: DivAttribs, ...children: Node[]) { return createSingle("div", attribs, ...children) }

function h1(text: string) { return createSingle("h1", undefined, document.createTextNode(text)) }

function img(attribs: ImgAttribs) { return createSingle("img", attribs); }

function createSingle<T extends OnClickAttrib>(tag: string, attribs?: T, ...children: Node[]) {
    const e = document.createElement(tag);
    if (attribs) {
        Object.entries(attribs).filter(([name, v]) => name != "onclick").forEach(([name, value]) => e.setAttribute(name, value));
        if (attribs.onclick) {
            e.onpointerdown = attribs.onclick
        }
    }
    children?.forEach(c => { e.appendChild(c); e.append(" "); });
    return e;
}

class OnClickAttrib {
    onclick?: ((this: GlobalEventHandlers, ev: PointerEvent) => any) | null;
}

class ButtonAttribs extends OnClickAttrib { }

class DivAttribs extends OnClickAttrib {
    class?: string;
    style?: string;
}

class ImgAttribs extends OnClickAttrib {
    alt?: string;
    src?: string;
    class?: string;
    style?: string;
}

class AAttribs extends OnClickAttrib {
    href?: string;
}
