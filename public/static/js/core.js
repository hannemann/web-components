(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };

  // js/Components/AbstractComponent.js
  var MUTATION_OBSERVER_OPTIONS = {
    subtree: true,
    attributes: true,
    childList: true,
    characterData: false,
    characterDataOldValue: false
  };
  var AbstractComponent = class extends HTMLElement {
    constructor() {
      super();
      this.shadow = this.attachShadow({ mode: "closed" });
      this.shadow.appendChild(this.template.content.cloneNode(true));
      this.initElements();
    }
    connectedCallback() {
      this.disconnectController = new AbortController();
      this.disconnectedSignal = this.disconnectController.signal;
      this.addListeners();
    }
    disconnectedCallback() {
      this.disconnectController.abort();
      this.removeMutations();
    }
    initElements() {
      for (const selector of Object.keys(this.elements)) {
        const nodes = Array.from(
          this.shadow.querySelectorAll(this.elements[selector])
        );
        this[selector] = nodes?.length === 1 ? nodes[0] : nodes;
      }
      return this;
    }
    addListeners() {
      return this.addEvents().addMutations();
    }
    addEvents() {
      for (const selector of Object.keys(this.listeners)) {
        const config = this.listeners[selector];
        let cb;
        for (const event of Object.keys(config)) {
          const nodes = "root" === selector ? [this.getRootNode()] : Array.from(this.shadow.querySelectorAll(selector));
          if ("function" === typeof config[event]) {
            cb = config[event];
          } else {
            console.group("TypeError: EventHandler");
            console.error("EventHandler is not a function");
            console.error("Handler Configuration: %o", config);
            console.groupEnd();
          }
          nodes.forEach((node) => {
            node.addEventListener(event, cb, {
              signal: this.disconnectedSignal
            });
          });
        }
      }
      return this;
    }
    addMutations() {
      if (!this.hasMutations)
        return;
      this.initMutationObserver();
      for (const element of Object.keys(this.mutations)) {
        const node = "root" === element ? this : this[element];
        this.mutationCallbacks = [
          ...this.mutationCallbacks || [],
          { ...{ node }, ...{ callbacks: this.mutations[element] } }
        ];
      }
      return this;
    }
    removeMutations() {
      if (this._mutationObserver) {
        this._mutationObserver.disconnect();
      }
    }
    initMutationObserver() {
      if (!this._mutationObserver) {
        const options = this.mutationObserverOptions || MUTATION_OBSERVER_OPTIONS;
        this._mutationObserver = new MutationObserver(
          this.mutationHandler.bind(this)
        );
        this._mutationObserver.observe(this, options);
        this._mutationObserver.observe(this.shadow, options);
      }
    }
    mutationHandler(mutationList, observer) {
      for (const mutation of mutationList) {
        const callbacks = this.mutationCallbacks.find((c) => {
          if (Array.isArray(c.node)) {
            return c.node.filter((i) => i === mutation.target).length > 0;
          }
          return c.node === mutation.target;
        })?.callbacks;
        if (callbacks) {
          Object.values(callbacks).forEach((configs) => {
            [configs].flat().filter((c) => c[mutation.type]).forEach((config) => {
              try {
                config[mutation.type](mutation, observer);
              } catch (error) {
                console.group("TypeError: MutationHandler");
                console.error("MutationHandler is not a function");
                console.error("Mutation: %o", mutation);
                console.error("Handler Configuration: %o", config);
                console.groupEnd();
              }
            });
          });
        }
      }
    }
    static initComponent(name, component, template6) {
      component.prototype.template = document.createElement("template");
      component.prototype.template.innerHTML = template6;
      customElements.define(name, component);
    }
    get elements() {
      return {};
    }
    get listeners() {
      return {};
    }
    get mutations() {
      return {};
    }
    get hasMutations() {
      return Object.keys(this.mutations).length > 0;
    }
  };

  // js/Components/Category/List.js
  var ITEMS_COUNT = 24;
  var ITEMS_URL = "https://dummyjson.com/products";
  var List = class extends AbstractComponent {
    get elements() {
      return {
        items: ".items"
      };
    }
    async connectedCallback() {
      console.time("Category");
      super.connectedCallback();
      if (this.dataset.pwa === "true") {
        try {
          const items = await this.load();
          const nodes = this.initProducts(items);
          this.render(nodes);
        } catch (error) {
          console.error(error);
        }
      }
      console.timeEnd("Category");
    }
    async load() {
      console.groupCollapsed("Start load timer.");
      console.time("load");
      const response = await fetch(ITEMS_URL);
      const result = await response.json();
      const items = result?.products?.slice(0, ITEMS_COUNT);
      console.timeEnd("load");
      console.groupEnd();
      return items;
    }
    initProducts(items) {
      console.groupCollapsed("Creating product tiles...");
      console.time("initProducts");
      const nodes = [];
      items.forEach((p) => {
        const node = document.createElement("category-item");
        node.productData = p;
        nodes.push(node);
      });
      console.log(`...${ITEMS_COUNT} product tiles created`);
      console.timeEnd("initProducts");
      console.groupEnd();
      return nodes;
    }
    render(nodes) {
      console.groupCollapsed("Render tiles");
      console.time("render");
      nodes.forEach((p, k) => {
        if (k === 4) {
          p.classList.add("wide");
        }
        if (k === 12) {
          p.classList.add("big");
        }
        this.appendChild(p);
      });
      console.log(`${ITEMS_COUNT} product tiles rendered`);
      console.timeEnd("render");
      console.groupEnd();
    }
    get products() {
      return this.items.querySelector("slot").assignedElements();
    }
  };
  var template = `
<style>
.items {
  display: grid;
  gap: var(--gap-l);
  grid-template-columns: repeat(auto-fit, minmax(var(--product-tile-width), 1fr));
  grid-auto-flow: dense;
}
</style>
<h2>Category</h2>
<div class="items">
  <slot></slot>
</div>
`;
  AbstractComponent.initComponent("category-list", List, template);

  // js/Components/Category/Item.js
  var Item = class extends AbstractComponent {
    #_data = null;
    static get observedAttributes() {
      return [
        "data-img",
        "data-brand",
        "data-title",
        "data-price",
        "data-description"
      ];
    }
    get elements() {
      return {
        imgNode: "figure img",
        brandNode: ".product-data h4",
        titleNode: ".product-data h3",
        priceNode: ".product-data span",
        hover: "category-item-hover"
      };
    }
    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue)
        return;
      const prop = name.split("-").pop();
      switch (name) {
        case "data-img":
          this[`${prop}Node`].src = this.img;
          break;
        case "data-title":
        case "data-brand":
        case "data-price":
          this[`${prop}Node`].innerText = this[prop];
          break;
      }
      if (this.hover?.renderData) {
        this.hover.renderData();
      }
    }
    set productData(data) {
      this.#_data = data;
      this.title = data.title;
      this.brand = data.brand;
      this.price = data.price;
      this.img = data.images[0];
      this.description = data.description;
    }
    get productData() {
      return this.#_data;
    }
    get img() {
      return this.dataset.img;
    }
    set img(v) {
      this.dataset.img = v.toString();
    }
    get title() {
      return this.dataset.title;
    }
    set title(v) {
      this.dataset.title = v.toString();
    }
    get brand() {
      return this.dataset.brand;
    }
    set brand(v) {
      this.dataset.brand = v.toString();
    }
    get price() {
      return parseFloat(this.dataset.price).toFixed(2);
    }
    set price(v) {
      this.dataset.price = v.toString();
    }
    get description() {
      return this.dataset.description;
    }
    set description(v) {
      this.dataset.description = v.toString();
    }
  };
  var template2 = `
<style>
:host {
  box-shadow: var(--list-item-shadow);
  background-color: hsl(0 0% 95%);
  display: grid;
  grid-template-rows: min-content;
  row-gap: var(--gap);
  grid-template-areas:
    "img"
    "data";
  padding-block-end: var(--gap);
  border-radius: var(--border-radius);
  overflow: hidden;
  position: relative;
}

figure {
  margin: 0;
  padding: 0;
  grid-area: img;
  width: 100%;
  aspect-ratio: 3 / 4;
}
img {
  background-color: hsl(0 0% 85%);
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-data {
  padding-inline: var(--gap);
  display: grid;
  row-gap: var(--gap);
  grid-area: data;
  grid-template-rows: max-content 1fr max-content;
  grid-template-areas:
    "brand"
    "title"
    "price";
}

.product-data > * {
  padding: 0;
  margin: 0;
}

h4 {
  grid-area: brand;
}

h3 {
  grid-area: title;
}

span {
  grid-area: price;
  text-align: right;
  font-weight: bold;
  font-size: larger;
}
category-item-hover {
    transform: translateY(120%);
    transition: transform 250ms ease-out;
}
:host(:hover) category-item-hover {
    transform: translateY(0);
}
</style>
<figure part="product-tile-media">
    <img loading="lazy" part="product-tile-media-image">
</figure>
<div class="product-data">
    <h4 part="product-tile-heading"></h4>
    <h3 part="product-tile-heading"></h3>
    <span part="product-tile-price"></span>
</div>
<category-item-hover exportparts="product-tile-price"></category-item-hover>
`;
  AbstractComponent.initComponent("category-item", Item, template2);

  // js/Components/Category/Item/Hover.js
  var Hover = class extends AbstractComponent {
    get elements() {
      return {
        brandNode: "h4",
        titleNode: "h3",
        descriptionNode: "p",
        priceNode: "span"
      };
    }
    connectedCallback() {
      super.connectedCallback();
      this.renderData();
    }
    renderData() {
      this.brandNode.innerText = this.parentNode.host.brand;
      this.titleNode.innerText = this.parentNode.host.title;
      this.descriptionNode.innerText = this.parentNode.host.description;
      this.priceNode.innerText = this.parentNode.host.price;
    }
  };
  var template3 = `
<style>
:host {
  position: absolute;
  inset: auto 0 0;
  background: var(--white);
  border-top-left-radius: var(--border-radius);
  border-top-right-radius: var(--border-radius);
  box-shadow: var(--category-item-hover-shadow);
  background-color: hsl(0 0% 95%);
  display: grid;
  grid-template-rows: min-content;
  row-gap: var(--gap);
  grid-template-rows: min-content min-content 1fr min-content min-content;
  grid-template-areas:
    "brand"
    "title"
    "description"
    "price"
    "buttons";
  padding: var(--gap);
}
:host > * {
  padding: 0;
  margin: 0;
}
h4 {
  grid-area: brand;
}
h3 {
  grid-area: title;
}
p {
  grid-area: description;
}
span {
  grid-area: price;
  text-align: right;
  font-weight: bold;
  font-size: larger;
}
.buttons {
  grid-area: buttons;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--gap-s);
}
.buttons button {
  width: 100%;
  border: none;
  background: var(--black);
  color: var(--white);
  padding: var(--gap) var(--gap-l);
  font-weight: bold;
  font-size: larger;
}
.buttons button.cta {
  background: var(--clr-cta);
}
</style>
<h4></h4>
<h3></h3>
<p></p>
<span part="product-tile-price"></span>
<div class="buttons">
    <button>Details</button>
    <button class="cta">Cart</button>
</div>
`;
  AbstractComponent.initComponent("category-item-hover", Hover, template3);

  // js/Components/Elements/Accordion/Item.js
  var _AccordionItem = class extends AbstractComponent {
    get elements() {
      return {
        contentSlot: "div.content-slot slot",
        contentNode: "div.content-slot"
      };
    }
    get listeners() {
      return {
        "div.label-slot": {
          click: this.toggle.bind(this)
        }
      };
    }
    connectedCallback() {
      if (!this.classList.contains("clone")) {
        super.connectedCallback();
        this.dataset.open = this.dataset.open ?? false.toString();
        this.initClone();
      }
    }
    initClone() {
      this.clone = new _AccordionItem();
      this.clone.innerHTML = this.innerHTML;
      this.clone.classList.add("clone");
      this.parentNode.appendChild(this.clone);
      requestAnimationFrame(() => {
        this.style.setProperty(
          "--height",
          this.clone.contentNode.offsetHeight.toString()
        );
      });
    }
    attributeChangedCallback(name, oldValue, newValue) {
      if (!this.isConnected || oldValue === newValue)
        return;
      if ("data-open" === name) {
        this.open = newValue === "true";
        this.dispatchEvent(new CustomEvent("change", { detail: this }));
      }
    }
    update() {
      if (this.open) {
        this.style.setProperty(
          "--height",
          this.clone.contentNode.offsetHeight.toString()
        );
      }
    }
    toggle() {
      this.open = !this.open;
      this.update();
    }
    get open() {
      return this.dataset.open === "true";
    }
    set open(v) {
      if (this.open !== !!v) {
        this.dataset.open = (!!v).toString();
      }
    }
  };
  var AccordionItem = _AccordionItem;
  __publicField(AccordionItem, "observedAttributes", ["data-open"]);
  var template4 = `
<style>
:host {
    display: block;
    overflow: hidden;
    position: relative;
}
div.label-slot {
    cursor: var(--cursor, pointer);
}
:host(:not(.clone)) div.content-slot {
    max-height: 0;
}
div.content-slot,
div.content-slot slot::slotted(*) {
    transition: all var(--transition-duration, 250ms) var(--transition-timing-function, ease-in-out);
}
:host(:not(.clone)[data-open="true"]) div.content-slot {
    max-height: calc(var(--height) * 1px);
}
:host(:not(.clone):not([data-open="true"])) div.content-slot slot::slotted(*) {
    margin-block: 0;
}
:host(.clone) {
    position: absolute;
    left: -200vw;
    width: 100%;
}
</style>
<div class="label-slot"><slot name="label"></slot></div>
<div class="content-slot"><slot></slot></div>
`;
  AbstractComponent.initComponent("accordion-item", AccordionItem, template4);

  // js/Components/Elements/Accordion/index.js
  var Accordion = class extends AbstractComponent {
    get elements() {
      return {
        itemSlot: "slot"
      };
    }
    connectedCallback() {
      super.connectedCallback();
      const evtOptions = {
        signal: this.disconnectedSignal
      };
      window.addEventListener("resize", () => this.updateItemList(), evtOptions);
      this.itemSlot.addEventListener(
        "slotchange",
        () => this.updateItemList(0),
        evtOptions
      );
      if (!screen.orientation) {
        window.addEventListener(
          "orientationchange",
          () => this.updateItemList(),
          evtOptions
        );
      } else {
        screen.orientation.addEventListener(
          "change",
          () => this.updateItemList(),
          evtOptions
        );
      }
      this.itemChangeHandler = this.handleItemChange.bind(this);
      this.items.forEach(
        (i) => i.addEventListener("change", this.itemChangeHandler, evtOptions)
      );
    }
    handleItemChange(e) {
      this.items.forEach(
        (i) => i.removeEventListener("change", this.itemChangeHandler)
      );
      if (e.detail.open && !this.multi) {
        this.items?.filter((i) => i !== e.detail).forEach((i) => i.open = false);
      }
      this.items.forEach(
        (i) => i.addEventListener("change", this.itemChangeHandler, {
          signal: this.disconnectedSignal
        })
      );
    }
    updateItemList(debounce = null) {
      const timeout = debounce ?? 50;
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }
      this.debounceTimeout = setTimeout(() => {
        this.items.forEach((i) => i.update());
      }, timeout);
    }
    closeAll() {
      this.items.forEach((i) => i.open = false);
    }
    get items() {
      return Array.from(this.querySelectorAll("accordion-item:not(.clone)"));
    }
    get multi() {
      return "undefined" !== typeof this.dataset.multi;
    }
  };
  var template5 = `
<style>
:host {
    position: relative;
    display: block;
    overflow: hidden;
}
</style>
<slot></slot>
`;
  AbstractComponent.initComponent("accordion-box", Accordion, template5);

  // js/Components/Todo/List.js
  var Todo = class extends AbstractComponent {
    get elements() {
      return {
        button: "button",
        input: "input"
      };
    }
    get listeners() {
      return {
        button: { click: this.addHandler.bind(this) },
        input: { keydown: this.addHandler.bind(this) }
      };
    }
    get mutations() {
      return {
        root: [{ childList: (m, o) => this.updateCounter(m, o) }]
      };
    }
    get mutationObserverOptions() {
      return {
        childList: true
      };
    }
    updateCounter() {
      this.shadow.querySelector("h3 span:first-of-type").innerHTML = this.todos.filter((t) => t.done).length.toString();
      this.shadow.querySelector("h3 span:last-of-type").innerHTML = this.todos.length.toString();
    }
    addHandler(e) {
      if (e.type === "keydown" && e.code !== "Enter")
        return;
      if (this.input.validity.valid) {
        this.addTodo(this.input.value);
        this.input.value = "";
      }
    }
    addTodo(label) {
      const item = document.createElement("todo-item");
      item.dataset.label = label;
      this.appendChild(item);
    }
    get todos() {
      return Array.from(this.querySelectorAll("todo-item")).map((i) => {
        return {
          label: i.label,
          done: i.checked
        };
      });
    }
    set todos(v) {
      this.querySelectorAll("todo-item").forEach((i) => i.delete());
      v.forEach((i) => this.addTodo(v));
    }
  };
  Todo.prototype.template = document.createElement("template");
  Todo.prototype.template.innerHTML = `
<style>
.add {
  padding: var(--list-item-padding);
  display: flex;
  gap: var(--item-padding-inline);
}
</style>
<h2><slot name="header">You should set a header</slot></h2>
<h3>Done: <span></span> / <span></span></h3>
<section class="add">
  <input placeholder="Todo" required min="3"><button>Add</button>
</section>
<section class="items">
    <slot></slot>
</section>
`;
  customElements.define("todo-list", Todo);

  // js/Components/Todo/Item.js
  var Item2 = class extends AbstractComponent {
    static get observedAttributes() {
      return ["data-done"];
    }
    get elements() {
      return {
        button: "button",
        input: "input"
      };
    }
    get listeners() {
      return {
        button: { click: this.deleteHandler.bind(this) },
        input: { change: this.updateHandler.bind(this) }
      };
    }
    connectedCallback() {
      super.connectedCallback();
      this.label = this.dataset.label;
      this.checked = this.dataset.done === "true";
      this.parentNode.updateCounter();
    }
    attributeChangedCallback(name, oldValue, newValue) {
      if (!this.input || oldValue === newValue)
        return;
      if ("data-done" === name) {
        this.checked = newValue === "true";
      }
    }
    updateHandler() {
      this.dataset.done = this.checked.toString();
      this.toggleLineThrough();
      this.parentNode.updateCounter();
    }
    deleteHandler() {
      this.parentNode.removeChild(this);
    }
    toggleLineThrough() {
      this.input.parentNode.classList.toggle("done", this.checked);
    }
    get checked() {
      return this.input.checked;
    }
    set checked(v) {
      if (this.checked !== !!v) {
        this.input.checked = !!v;
        this.toggleLineThrough();
        this.input.dispatchEvent(new Event("change"));
      }
    }
    get label() {
      return this.shadow.querySelector("label span").innerHTML;
    }
    set label(v) {
      this.shadow.querySelector("label span").innerHTML = v;
    }
  };
  Item2.prototype.template = document.createElement("template");
  Item2.prototype.template.innerHTML = `
<style>
:host {
  display: flex;
  justify-content: space-between;
  background: var(--clr-bg-list-item);
  padding: var(--list-item-padding);
}
:host(:hover) {
  background-color: var(--clr-bg-list-item-hover);
}
label.done span {
  text-decoration: line-through;
}
</style>
<label>
    <input type="checkbox">
    <span></span>
</label>
<button>Delete</button>
`;
  customElements.define("todo-item", Item2);

  // js/Components/My.js
  var MyComponent = class extends AbstractComponent {
    get elements() {
      return {
        my: ".myElement",
        button: ".button"
      };
    }
    get listeners() {
      return {
        ".button": {
          click: (e) => this.my.appendChild(document.createTextNode(" are awesome!!"))
        }
      };
    }
    get mutations() {
      return {
        my: [
          { childList: (m, o) => console.log(m) },
          { childList: (m, o) => console.log(o) },
          { childList: "This raises an error" }
        ],
        button: [{ childList: (m, o) => console.log(m, o) }]
      };
    }
    connectedCallback() {
      super.connectedCallback();
      console.log(this.my);
    }
  };
  MyComponent.prototype.template = document.createElement("template");
  MyComponent.prototype.template.innerHTML = `
<button class="button">Click!</button>
<div class="myElement">
    Web Components
</div>
`;
  customElements.define("my-component", MyComponent);

  // js/Router.js
  var Router = class {
    #_routes = [];
    #_initial = "/";
    #_current = "/";
    constructor() {
      this.current = location.pathname;
      this.initial = this.current;
      this.abortController = new AbortController();
      this.abortSignal = this.abortController.signal;
      addEventListener("popstate", (e) => this.handleHistoryPop(e));
    }
    route(route = "/", cb = () => {
    }) {
      this.routes.push({ route, cb });
      this.addListener(route, cb);
    }
    addListener(route, cb) {
      document.querySelectorAll(`[href="/${route}"]`).forEach((node) => {
        node.addEventListener(
          "click",
          (e) => {
            e.preventDefault();
            this.push(route);
            cb();
          },
          {
            signal: this.abortSignal
          }
        );
      });
    }
    addListeners() {
      this.routes.forEach((i) => this.addListener(i.route, i.cb));
    }
    push(route) {
      history.pushState(route, "", route);
    }
    handleHistoryPop(e) {
      this.abortController.abort();
      if (location.pathname === this.initial) {
        location.reload();
      } else {
        this.routes.find((r) => e.state === r.route)?.cb?.();
      }
    }
    get initial() {
      return this.#_initial;
    }
    set initial(v) {
      this.#_initial = v;
    }
    get routes() {
      return this.#_routes;
    }
    set routes(v) {
      this.#_routes = v;
    }
    get current() {
      return this.#_current;
    }
    set current(v) {
      this.#_current = v;
    }
  };

  // js/routes.js
  var clearBody = () => {
    document.body.querySelectorAll(":scope > *").forEach((n) => document.body.removeChild(n));
  };
  var init = (router2) => {
    router2.route("router-test", () => {
      console.log("Routed to router-test");
      clearBody();
      const node = document.createElement("category-list");
      node.dataset.pwa = "true";
      document.body.appendChild(node);
    });
  };

  // js/core.js
  var router = new Router();
  init(router);
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vc3JjL2pzL0NvbXBvbmVudHMvQWJzdHJhY3RDb21wb25lbnQuanMiLCAiLi4vLi4vLi4vc3JjL2pzL0NvbXBvbmVudHMvQ2F0ZWdvcnkvTGlzdC5qcyIsICIuLi8uLi8uLi9zcmMvanMvQ29tcG9uZW50cy9DYXRlZ29yeS9JdGVtLmpzIiwgIi4uLy4uLy4uL3NyYy9qcy9Db21wb25lbnRzL0NhdGVnb3J5L0l0ZW0vSG92ZXIuanMiLCAiLi4vLi4vLi4vc3JjL2pzL0NvbXBvbmVudHMvRWxlbWVudHMvQWNjb3JkaW9uL0l0ZW0uanMiLCAiLi4vLi4vLi4vc3JjL2pzL0NvbXBvbmVudHMvRWxlbWVudHMvQWNjb3JkaW9uL2luZGV4LmpzIiwgIi4uLy4uLy4uL3NyYy9qcy9Db21wb25lbnRzL1RvZG8vTGlzdC5qcyIsICIuLi8uLi8uLi9zcmMvanMvQ29tcG9uZW50cy9Ub2RvL0l0ZW0uanMiLCAiLi4vLi4vLi4vc3JjL2pzL0NvbXBvbmVudHMvTXkuanMiLCAiLi4vLi4vLi4vc3JjL2pzL1JvdXRlci5qcyIsICIuLi8uLi8uLi9zcmMvanMvcm91dGVzLmpzIiwgIi4uLy4uLy4uL3NyYy9qcy9jb3JlLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBNVVRBVElPTl9PQlNFUlZFUl9PUFRJT05TID0ge1xuICBzdWJ0cmVlOiB0cnVlLFxuICBhdHRyaWJ1dGVzOiB0cnVlLFxuICBjaGlsZExpc3Q6IHRydWUsXG4gIGNoYXJhY3RlckRhdGE6IGZhbHNlLFxuICBjaGFyYWN0ZXJEYXRhT2xkVmFsdWU6IGZhbHNlLFxufTtcblxuZXhwb3J0IGNsYXNzIEFic3RyYWN0Q29tcG9uZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuc2hhZG93ID0gdGhpcy5hdHRhY2hTaGFkb3coeyBtb2RlOiBcImNsb3NlZFwiIH0pO1xuICAgIHRoaXMuc2hhZG93LmFwcGVuZENoaWxkKHRoaXMudGVtcGxhdGUuY29udGVudC5jbG9uZU5vZGUodHJ1ZSkpO1xuICAgIHRoaXMuaW5pdEVsZW1lbnRzKCk7XG4gIH1cbiAgLyoqXG4gICAqIEluaXRpYWxpemVcbiAgICogRmlyZWQgd2hlbiBhZGRlZCB0byBkb21cbiAgICovXG4gIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIHRoaXMuZGlzY29ubmVjdENvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gICAgdGhpcy5kaXNjb25uZWN0ZWRTaWduYWwgPSB0aGlzLmRpc2Nvbm5lY3RDb250cm9sbGVyLnNpZ25hbDtcbiAgICB0aGlzLmFkZExpc3RlbmVycygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZSBkaXNjb25uZWN0XG4gICAqIEZpcmVkIHdoZW4gcmVtb3ZlZCBmcm9tIGRvbVxuICAgKi9cbiAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgdGhpcy5kaXNjb25uZWN0Q29udHJvbGxlci5hYm9ydCgpO1xuICAgIHRoaXMucmVtb3ZlTXV0YXRpb25zKCk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBlbGVtZW50c1xuICAgKiBAcmV0dXJucyB7dGhpc31cbiAgICovXG4gIGluaXRFbGVtZW50cygpIHtcbiAgICBmb3IgKGNvbnN0IHNlbGVjdG9yIG9mIE9iamVjdC5rZXlzKHRoaXMuZWxlbWVudHMpKSB7XG4gICAgICBjb25zdCBub2RlcyA9IEFycmF5LmZyb20oXG4gICAgICAgIHRoaXMuc2hhZG93LnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy5lbGVtZW50c1tzZWxlY3Rvcl0pXG4gICAgICApO1xuICAgICAgdGhpc1tzZWxlY3Rvcl0gPSBub2Rlcz8ubGVuZ3RoID09PSAxID8gbm9kZXNbMF0gOiBub2RlcztcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGxpc3RlbmVyc1xuICAgKiBAcmV0dXJucyB7dGhpc31cbiAgICovXG4gIGFkZExpc3RlbmVycygpIHtcbiAgICByZXR1cm4gdGhpcy5hZGRFdmVudHMoKS5hZGRNdXRhdGlvbnMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgZXZlbnQgbGlzdGVuZXJzXG4gICAqIEByZXR1cm5zIHt0aGlzfVxuICAgKi9cbiAgYWRkRXZlbnRzKCkge1xuICAgIGZvciAoY29uc3Qgc2VsZWN0b3Igb2YgT2JqZWN0LmtleXModGhpcy5saXN0ZW5lcnMpKSB7XG4gICAgICBjb25zdCBjb25maWcgPSB0aGlzLmxpc3RlbmVyc1tzZWxlY3Rvcl07XG4gICAgICBsZXQgY2I7XG4gICAgICBmb3IgKGNvbnN0IGV2ZW50IG9mIE9iamVjdC5rZXlzKGNvbmZpZykpIHtcbiAgICAgICAgY29uc3Qgbm9kZXMgPVxuICAgICAgICAgIFwicm9vdFwiID09PSBzZWxlY3RvclxuICAgICAgICAgICAgPyBbdGhpcy5nZXRSb290Tm9kZSgpXVxuICAgICAgICAgICAgOiBBcnJheS5mcm9tKHRoaXMuc2hhZG93LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpKTtcbiAgICAgICAgaWYgKFwiZnVuY3Rpb25cIiA9PT0gdHlwZW9mIGNvbmZpZ1tldmVudF0pIHtcbiAgICAgICAgICBjYiA9IGNvbmZpZ1tldmVudF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc29sZS5ncm91cChcIlR5cGVFcnJvcjogRXZlbnRIYW5kbGVyXCIpO1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFdmVudEhhbmRsZXIgaXMgbm90IGEgZnVuY3Rpb25cIik7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIkhhbmRsZXIgQ29uZmlndXJhdGlvbjogJW9cIiwgY29uZmlnKTtcbiAgICAgICAgICBjb25zb2xlLmdyb3VwRW5kKCk7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZXMuZm9yRWFjaCgobm9kZSkgPT4ge1xuICAgICAgICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgY2IsIHtcbiAgICAgICAgICAgIHNpZ25hbDogdGhpcy5kaXNjb25uZWN0ZWRTaWduYWwsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgbXV0YXRpb24gb2JzZXJ2ZXJzXG4gICAqIEByZXR1cm5zIHt0aGlzfVxuICAgKi9cbiAgYWRkTXV0YXRpb25zKCkge1xuICAgIGlmICghdGhpcy5oYXNNdXRhdGlvbnMpIHJldHVybjtcbiAgICB0aGlzLmluaXRNdXRhdGlvbk9ic2VydmVyKCk7XG4gICAgZm9yIChjb25zdCBlbGVtZW50IG9mIE9iamVjdC5rZXlzKHRoaXMubXV0YXRpb25zKSkge1xuICAgICAgY29uc3Qgbm9kZSA9IFwicm9vdFwiID09PSBlbGVtZW50ID8gdGhpcyA6IHRoaXNbZWxlbWVudF07XG4gICAgICB0aGlzLm11dGF0aW9uQ2FsbGJhY2tzID0gW1xuICAgICAgICAuLi4odGhpcy5tdXRhdGlvbkNhbGxiYWNrcyB8fCBbXSksXG4gICAgICAgIHsgLi4ueyBub2RlIH0sIC4uLnsgY2FsbGJhY2tzOiB0aGlzLm11dGF0aW9uc1tlbGVtZW50XSB9IH0sXG4gICAgICBdO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNjb25uZWN0IE11dGF0aW9uT2JzZXJ2ZXJcbiAgICovXG4gIHJlbW92ZU11dGF0aW9ucygpIHtcbiAgICBpZiAodGhpcy5fbXV0YXRpb25PYnNlcnZlcikge1xuICAgICAgdGhpcy5fbXV0YXRpb25PYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgTXV0YXRpb25PYnNlcnZlclxuICAgKiBAcmV0dXJucyB7TXV0YXRpb25PYnNlcnZlcn1cbiAgICovXG4gIGluaXRNdXRhdGlvbk9ic2VydmVyKCkge1xuICAgIGlmICghdGhpcy5fbXV0YXRpb25PYnNlcnZlcikge1xuICAgICAgY29uc3Qgb3B0aW9ucyA9IHRoaXMubXV0YXRpb25PYnNlcnZlck9wdGlvbnMgfHwgTVVUQVRJT05fT0JTRVJWRVJfT1BUSU9OUztcbiAgICAgIHRoaXMuX211dGF0aW9uT2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihcbiAgICAgICAgdGhpcy5tdXRhdGlvbkhhbmRsZXIuYmluZCh0aGlzKVxuICAgICAgKTtcbiAgICAgIHRoaXMuX211dGF0aW9uT2JzZXJ2ZXIub2JzZXJ2ZSh0aGlzLCBvcHRpb25zKTtcbiAgICAgIHRoaXMuX211dGF0aW9uT2JzZXJ2ZXIub2JzZXJ2ZSh0aGlzLnNoYWRvdywgb3B0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIExpc3RlbiB0byBtdXRhdGlvbnNcbiAgICogQHBhcmFtIHtNdXRhdGlvblJlY29yZH0gbXV0YXRpb25MaXN0XG4gICAqIEBwYXJhbSB7TXV0YXRpb25PYnNlcnZlcn0gb2JzZXJ2ZXJcbiAgICovXG4gIG11dGF0aW9uSGFuZGxlcihtdXRhdGlvbkxpc3QsIG9ic2VydmVyKSB7XG4gICAgZm9yIChjb25zdCBtdXRhdGlvbiBvZiBtdXRhdGlvbkxpc3QpIHtcbiAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IHRoaXMubXV0YXRpb25DYWxsYmFja3MuZmluZCgoYykgPT4ge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShjLm5vZGUpKSB7XG4gICAgICAgICAgcmV0dXJuIGMubm9kZS5maWx0ZXIoKGkpID0+IGkgPT09IG11dGF0aW9uLnRhcmdldCkubGVuZ3RoID4gMDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYy5ub2RlID09PSBtdXRhdGlvbi50YXJnZXQ7XG4gICAgICB9KT8uY2FsbGJhY2tzO1xuICAgICAgaWYgKGNhbGxiYWNrcykge1xuICAgICAgICBPYmplY3QudmFsdWVzKGNhbGxiYWNrcykuZm9yRWFjaCgoY29uZmlncykgPT4ge1xuICAgICAgICAgIFtjb25maWdzXVxuICAgICAgICAgICAgLmZsYXQoKVxuICAgICAgICAgICAgLmZpbHRlcigoYykgPT4gY1ttdXRhdGlvbi50eXBlXSlcbiAgICAgICAgICAgIC5mb3JFYWNoKChjb25maWcpID0+IHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25maWdbbXV0YXRpb24udHlwZV0obXV0YXRpb24sIG9ic2VydmVyKTtcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmdyb3VwKFwiVHlwZUVycm9yOiBNdXRhdGlvbkhhbmRsZXJcIik7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIk11dGF0aW9uSGFuZGxlciBpcyBub3QgYSBmdW5jdGlvblwiKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiTXV0YXRpb246ICVvXCIsIG11dGF0aW9uKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiSGFuZGxlciBDb25maWd1cmF0aW9uOiAlb1wiLCBjb25maWcpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZ3JvdXBFbmQoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBpbml0Q29tcG9uZW50KG5hbWUsIGNvbXBvbmVudCwgdGVtcGxhdGUpIHtcbiAgICBjb21wb25lbnQucHJvdG90eXBlLnRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRlbXBsYXRlXCIpO1xuICAgIGNvbXBvbmVudC5wcm90b3R5cGUudGVtcGxhdGUuaW5uZXJIVE1MID0gdGVtcGxhdGU7XG4gICAgY3VzdG9tRWxlbWVudHMuZGVmaW5lKG5hbWUsIGNvbXBvbmVudCk7XG4gIH1cblxuICAvKipcbiAgICogT2J0YWluIGVsZW1lbnRzXG4gICAqIHVzZWQgdG8gbWFwIGVsZW1lbnRzIHRvIGluc3RhbmNlIGZvciBsYXRlciB1c2VcbiAgICogQHJldHVybnMge09iamVjdC48U3RyaW5nOiBTdHJpbmc+fVxuICAgKi9cbiAgZ2V0IGVsZW1lbnRzKCkge1xuICAgIHJldHVybiB7fTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPYnRhaW4gbGlzdGVuZXJzXG4gICAqIHVzZWQgdG8gYWRkIGV2ZW50IGxpc3RlbmVyc1xuICAgKiBAcmV0dXJucyB7T2JqZWN0LjxTdHJpbmc6IE9iamVjdC48U3RyaW5nOiBTdHJpbmc+fVxuICAgKi9cbiAgZ2V0IGxpc3RlbmVycygpIHtcbiAgICByZXR1cm4ge307XG4gIH1cblxuICAvKipcbiAgICogT2J0YWluIG11dGF0aW9uc1xuICAgKiB1c2VkIHRvIGFkZCBjYWxsYmFja3MgdG8gbXV0YXRpb24gb2JzZXJ2ZXJcbiAgICogQHJldHVybnMge09iamVjdC48U3RyaW5nOiBPYmplY3QuPFN0cmluZzogU3RyaW5nPn1cbiAgICovXG4gIGdldCBtdXRhdGlvbnMoKSB7XG4gICAgcmV0dXJuIHt9O1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZSBpZiB3ZSB1c2UgbXV0YXRpb25zXG4gICAqIEByZXR1cm5zIHtCb29sZWFufVxuICAgKi9cbiAgZ2V0IGhhc011dGF0aW9ucygpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5tdXRhdGlvbnMpLmxlbmd0aCA+IDA7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBYnN0cmFjdENvbXBvbmVudCB9IGZyb20gXCIuLi9BYnN0cmFjdENvbXBvbmVudC5qc1wiO1xuXG5jb25zdCBJVEVNU19DT1VOVCA9IDI0O1xuY29uc3QgSVRFTVNfVVJMID0gXCJodHRwczovL2R1bW15anNvbi5jb20vcHJvZHVjdHNcIjtcblxuY2xhc3MgTGlzdCBleHRlbmRzIEFic3RyYWN0Q29tcG9uZW50IHtcbiAgZ2V0IGVsZW1lbnRzKCkge1xuICAgIHJldHVybiB7XG4gICAgICBpdGVtczogXCIuaXRlbXNcIixcbiAgICB9O1xuICB9XG5cbiAgYXN5bmMgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgY29uc29sZS50aW1lKFwiQ2F0ZWdvcnlcIik7XG4gICAgc3VwZXIuY29ubmVjdGVkQ2FsbGJhY2soKTtcbiAgICBpZiAodGhpcy5kYXRhc2V0LnB3YSA9PT0gXCJ0cnVlXCIpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGl0ZW1zID0gYXdhaXQgdGhpcy5sb2FkKCk7XG4gICAgICAgIGNvbnN0IG5vZGVzID0gdGhpcy5pbml0UHJvZHVjdHMoaXRlbXMpO1xuICAgICAgICB0aGlzLnJlbmRlcihub2Rlcyk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc29sZS50aW1lRW5kKFwiQ2F0ZWdvcnlcIik7XG4gIH1cblxuICBhc3luYyBsb2FkKCkge1xuICAgIGNvbnNvbGUuZ3JvdXBDb2xsYXBzZWQoXCJTdGFydCBsb2FkIHRpbWVyLlwiKTtcbiAgICBjb25zb2xlLnRpbWUoXCJsb2FkXCIpO1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goSVRFTVNfVVJMKTtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgY29uc3QgaXRlbXMgPSByZXN1bHQ/LnByb2R1Y3RzPy5zbGljZSgwLCBJVEVNU19DT1VOVCk7XG4gICAgY29uc29sZS50aW1lRW5kKFwibG9hZFwiKTtcbiAgICBjb25zb2xlLmdyb3VwRW5kKCk7XG4gICAgcmV0dXJuIGl0ZW1zO1xuICB9XG5cbiAgaW5pdFByb2R1Y3RzKGl0ZW1zKSB7XG4gICAgY29uc29sZS5ncm91cENvbGxhcHNlZChcIkNyZWF0aW5nIHByb2R1Y3QgdGlsZXMuLi5cIik7XG4gICAgY29uc29sZS50aW1lKFwiaW5pdFByb2R1Y3RzXCIpO1xuICAgIGNvbnN0IG5vZGVzID0gW107XG4gICAgaXRlbXMuZm9yRWFjaCgocCkgPT4ge1xuICAgICAgY29uc3Qgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYXRlZ29yeS1pdGVtXCIpO1xuICAgICAgbm9kZS5wcm9kdWN0RGF0YSA9IHA7XG4gICAgICBub2Rlcy5wdXNoKG5vZGUpO1xuICAgIH0pO1xuICAgIGNvbnNvbGUubG9nKGAuLi4ke0lURU1TX0NPVU5UfSBwcm9kdWN0IHRpbGVzIGNyZWF0ZWRgKTtcbiAgICBjb25zb2xlLnRpbWVFbmQoXCJpbml0UHJvZHVjdHNcIik7XG4gICAgY29uc29sZS5ncm91cEVuZCgpO1xuICAgIHJldHVybiBub2RlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBlbmQgaXRlbXMgYW5kIGFzc2lnbiB0byBzbG90XG4gICAqIEBwYXJhbSB7QXJyYXkuPEhUTUxFbGVtZW50Pn0gbm9kZXNcbiAgICovXG4gIHJlbmRlcihub2Rlcykge1xuICAgIGNvbnNvbGUuZ3JvdXBDb2xsYXBzZWQoXCJSZW5kZXIgdGlsZXNcIik7XG4gICAgY29uc29sZS50aW1lKFwicmVuZGVyXCIpO1xuICAgIG5vZGVzLmZvckVhY2goKHAsIGspID0+IHtcbiAgICAgIGlmIChrID09PSA0KSB7XG4gICAgICAgIHAuY2xhc3NMaXN0LmFkZChcIndpZGVcIik7XG4gICAgICB9XG4gICAgICBpZiAoayA9PT0gMTIpIHtcbiAgICAgICAgcC5jbGFzc0xpc3QuYWRkKFwiYmlnXCIpO1xuICAgICAgfVxuICAgICAgdGhpcy5hcHBlbmRDaGlsZChwKTtcbiAgICB9KTtcbiAgICBjb25zb2xlLmxvZyhgJHtJVEVNU19DT1VOVH0gcHJvZHVjdCB0aWxlcyByZW5kZXJlZGApO1xuICAgIGNvbnNvbGUudGltZUVuZChcInJlbmRlclwiKTtcbiAgICBjb25zb2xlLmdyb3VwRW5kKCk7XG4gIH1cblxuICAvKipcbiAgICogT2J0YWluIGNhdGVnb3J5LWl0ZW0ncyBmcm9tIHNsb3RcbiAgICovXG4gIGdldCBwcm9kdWN0cygpIHtcbiAgICByZXR1cm4gdGhpcy5pdGVtcy5xdWVyeVNlbGVjdG9yKFwic2xvdFwiKS5hc3NpZ25lZEVsZW1lbnRzKCk7XG4gIH1cbn1cblxuY29uc3QgdGVtcGxhdGUgPSAvKiBodG1sICovIGBcbjxzdHlsZT5cbi5pdGVtcyB7XG4gIGRpc3BsYXk6IGdyaWQ7XG4gIGdhcDogdmFyKC0tZ2FwLWwpO1xuICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdChhdXRvLWZpdCwgbWlubWF4KHZhcigtLXByb2R1Y3QtdGlsZS13aWR0aCksIDFmcikpO1xuICBncmlkLWF1dG8tZmxvdzogZGVuc2U7XG59XG48L3N0eWxlPlxuPGgyPkNhdGVnb3J5PC9oMj5cbjxkaXYgY2xhc3M9XCJpdGVtc1wiPlxuICA8c2xvdD48L3Nsb3Q+XG48L2Rpdj5cbmA7XG5cbkFic3RyYWN0Q29tcG9uZW50LmluaXRDb21wb25lbnQoXCJjYXRlZ29yeS1saXN0XCIsIExpc3QsIHRlbXBsYXRlKTtcbiIsICJpbXBvcnQgeyBBYnN0cmFjdENvbXBvbmVudCB9IGZyb20gXCIuLi9BYnN0cmFjdENvbXBvbmVudC5qc1wiO1xuXG5jbGFzcyBJdGVtIGV4dGVuZHMgQWJzdHJhY3RDb21wb25lbnQge1xuICAjX2RhdGEgPSBudWxsO1xuICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCJkYXRhLWltZ1wiLFxuICAgICAgXCJkYXRhLWJyYW5kXCIsXG4gICAgICBcImRhdGEtdGl0bGVcIixcbiAgICAgIFwiZGF0YS1wcmljZVwiLFxuICAgICAgXCJkYXRhLWRlc2NyaXB0aW9uXCIsXG4gICAgXTtcbiAgfVxuICBnZXQgZWxlbWVudHMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGltZ05vZGU6IFwiZmlndXJlIGltZ1wiLFxuICAgICAgYnJhbmROb2RlOiBcIi5wcm9kdWN0LWRhdGEgaDRcIixcbiAgICAgIHRpdGxlTm9kZTogXCIucHJvZHVjdC1kYXRhIGgzXCIsXG4gICAgICBwcmljZU5vZGU6IFwiLnByb2R1Y3QtZGF0YSBzcGFuXCIsXG4gICAgICBob3ZlcjogXCJjYXRlZ29yeS1pdGVtLWhvdmVyXCIsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGUgYXR0cmlidXRlIGNoYW5nZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gb2xkVmFsdWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG5ld1ZhbHVlXG4gICAqL1xuICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgaWYgKG9sZFZhbHVlID09PSBuZXdWYWx1ZSkgcmV0dXJuO1xuICAgIGNvbnN0IHByb3AgPSBuYW1lLnNwbGl0KFwiLVwiKS5wb3AoKTtcbiAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgIGNhc2UgXCJkYXRhLWltZ1wiOlxuICAgICAgICB0aGlzW2Ake3Byb3B9Tm9kZWBdLnNyYyA9IHRoaXMuaW1nO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJkYXRhLXRpdGxlXCI6XG4gICAgICBjYXNlIFwiZGF0YS1icmFuZFwiOlxuICAgICAgY2FzZSBcImRhdGEtcHJpY2VcIjpcbiAgICAgICAgdGhpc1tgJHtwcm9wfU5vZGVgXS5pbm5lclRleHQgPSB0aGlzW3Byb3BdO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgaWYgKHRoaXMuaG92ZXI/LnJlbmRlckRhdGEpIHtcbiAgICAgIHRoaXMuaG92ZXIucmVuZGVyRGF0YSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gdlxuICAgKi9cbiAgc2V0IHByb2R1Y3REYXRhKGRhdGEpIHtcbiAgICB0aGlzLiNfZGF0YSA9IGRhdGE7XG4gICAgdGhpcy50aXRsZSA9IGRhdGEudGl0bGU7XG4gICAgdGhpcy5icmFuZCA9IGRhdGEuYnJhbmQ7XG4gICAgdGhpcy5wcmljZSA9IGRhdGEucHJpY2U7XG4gICAgdGhpcy5pbWcgPSBkYXRhLmltYWdlc1swXTtcbiAgICB0aGlzLmRlc2NyaXB0aW9uID0gZGF0YS5kZXNjcmlwdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gdlxuICAgKi9cbiAgZ2V0IHByb2R1Y3REYXRhKCkge1xuICAgIHJldHVybiB0aGlzLiNfZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtTdHJpbmd9XG4gICAqL1xuICBnZXQgaW1nKCkge1xuICAgIHJldHVybiB0aGlzLmRhdGFzZXQuaW1nO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB2XG4gICAqL1xuICBzZXQgaW1nKHYpIHtcbiAgICB0aGlzLmRhdGFzZXQuaW1nID0gdi50b1N0cmluZygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICovXG4gIGdldCB0aXRsZSgpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhc2V0LnRpdGxlO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB2XG4gICAqL1xuICBzZXQgdGl0bGUodikge1xuICAgIHRoaXMuZGF0YXNldC50aXRsZSA9IHYudG9TdHJpbmcoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtTdHJpbmd9XG4gICAqL1xuICBnZXQgYnJhbmQoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YXNldC5icmFuZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gdlxuICAgKi9cbiAgc2V0IGJyYW5kKHYpIHtcbiAgICB0aGlzLmRhdGFzZXQuYnJhbmQgPSB2LnRvU3RyaW5nKCk7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7U3RyaW5nfVxuICAgKi9cbiAgZ2V0IHByaWNlKCkge1xuICAgIHJldHVybiBwYXJzZUZsb2F0KHRoaXMuZGF0YXNldC5wcmljZSkudG9GaXhlZCgyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge051bWJlcn0gdlxuICAgKi9cbiAgc2V0IHByaWNlKHYpIHtcbiAgICB0aGlzLmRhdGFzZXQucHJpY2UgPSB2LnRvU3RyaW5nKCk7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7U3RyaW5nfVxuICAgKi9cbiAgZ2V0IGRlc2NyaXB0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmRhdGFzZXQuZGVzY3JpcHRpb247XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHZcbiAgICovXG4gIHNldCBkZXNjcmlwdGlvbih2KSB7XG4gICAgdGhpcy5kYXRhc2V0LmRlc2NyaXB0aW9uID0gdi50b1N0cmluZygpO1xuICB9XG59XG5cbmNvbnN0IHRlbXBsYXRlID0gLyogaHRtbCAqLyBgXG48c3R5bGU+XG46aG9zdCB7XG4gIGJveC1zaGFkb3c6IHZhcigtLWxpc3QtaXRlbS1zaGFkb3cpO1xuICBiYWNrZ3JvdW5kLWNvbG9yOiBoc2woMCAwJSA5NSUpO1xuICBkaXNwbGF5OiBncmlkO1xuICBncmlkLXRlbXBsYXRlLXJvd3M6IG1pbi1jb250ZW50O1xuICByb3ctZ2FwOiB2YXIoLS1nYXApO1xuICBncmlkLXRlbXBsYXRlLWFyZWFzOlxuICAgIFwiaW1nXCJcbiAgICBcImRhdGFcIjtcbiAgcGFkZGluZy1ibG9jay1lbmQ6IHZhcigtLWdhcCk7XG4gIGJvcmRlci1yYWRpdXM6IHZhcigtLWJvcmRlci1yYWRpdXMpO1xuICBvdmVyZmxvdzogaGlkZGVuO1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG59XG5cbmZpZ3VyZSB7XG4gIG1hcmdpbjogMDtcbiAgcGFkZGluZzogMDtcbiAgZ3JpZC1hcmVhOiBpbWc7XG4gIHdpZHRoOiAxMDAlO1xuICBhc3BlY3QtcmF0aW86IDMgLyA0O1xufVxuaW1nIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogaHNsKDAgMCUgODUlKTtcbiAgd2lkdGg6IDEwMCU7XG4gIGhlaWdodDogMTAwJTtcbiAgb2JqZWN0LWZpdDogY292ZXI7XG59XG5cbi5wcm9kdWN0LWRhdGEge1xuICBwYWRkaW5nLWlubGluZTogdmFyKC0tZ2FwKTtcbiAgZGlzcGxheTogZ3JpZDtcbiAgcm93LWdhcDogdmFyKC0tZ2FwKTtcbiAgZ3JpZC1hcmVhOiBkYXRhO1xuICBncmlkLXRlbXBsYXRlLXJvd3M6IG1heC1jb250ZW50IDFmciBtYXgtY29udGVudDtcbiAgZ3JpZC10ZW1wbGF0ZS1hcmVhczpcbiAgICBcImJyYW5kXCJcbiAgICBcInRpdGxlXCJcbiAgICBcInByaWNlXCI7XG59XG5cbi5wcm9kdWN0LWRhdGEgPiAqIHtcbiAgcGFkZGluZzogMDtcbiAgbWFyZ2luOiAwO1xufVxuXG5oNCB7XG4gIGdyaWQtYXJlYTogYnJhbmQ7XG59XG5cbmgzIHtcbiAgZ3JpZC1hcmVhOiB0aXRsZTtcbn1cblxuc3BhbiB7XG4gIGdyaWQtYXJlYTogcHJpY2U7XG4gIHRleHQtYWxpZ246IHJpZ2h0O1xuICBmb250LXdlaWdodDogYm9sZDtcbiAgZm9udC1zaXplOiBsYXJnZXI7XG59XG5jYXRlZ29yeS1pdGVtLWhvdmVyIHtcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoMTIwJSk7XG4gICAgdHJhbnNpdGlvbjogdHJhbnNmb3JtIDI1MG1zIGVhc2Utb3V0O1xufVxuOmhvc3QoOmhvdmVyKSBjYXRlZ29yeS1pdGVtLWhvdmVyIHtcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoMCk7XG59XG48L3N0eWxlPlxuPGZpZ3VyZSBwYXJ0PVwicHJvZHVjdC10aWxlLW1lZGlhXCI+XG4gICAgPGltZyBsb2FkaW5nPVwibGF6eVwiIHBhcnQ9XCJwcm9kdWN0LXRpbGUtbWVkaWEtaW1hZ2VcIj5cbjwvZmlndXJlPlxuPGRpdiBjbGFzcz1cInByb2R1Y3QtZGF0YVwiPlxuICAgIDxoNCBwYXJ0PVwicHJvZHVjdC10aWxlLWhlYWRpbmdcIj48L2g0PlxuICAgIDxoMyBwYXJ0PVwicHJvZHVjdC10aWxlLWhlYWRpbmdcIj48L2gzPlxuICAgIDxzcGFuIHBhcnQ9XCJwcm9kdWN0LXRpbGUtcHJpY2VcIj48L3NwYW4+XG48L2Rpdj5cbjxjYXRlZ29yeS1pdGVtLWhvdmVyIGV4cG9ydHBhcnRzPVwicHJvZHVjdC10aWxlLXByaWNlXCI+PC9jYXRlZ29yeS1pdGVtLWhvdmVyPlxuYDtcblxuQWJzdHJhY3RDb21wb25lbnQuaW5pdENvbXBvbmVudChcImNhdGVnb3J5LWl0ZW1cIiwgSXRlbSwgdGVtcGxhdGUpO1xuIiwgImltcG9ydCB7IEFic3RyYWN0Q29tcG9uZW50IH0gZnJvbSBcIi4uLy4uL0Fic3RyYWN0Q29tcG9uZW50LmpzXCI7XG5cbmNsYXNzIEhvdmVyIGV4dGVuZHMgQWJzdHJhY3RDb21wb25lbnQge1xuICBnZXQgZWxlbWVudHMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJyYW5kTm9kZTogXCJoNFwiLFxuICAgICAgdGl0bGVOb2RlOiBcImgzXCIsXG4gICAgICBkZXNjcmlwdGlvbk5vZGU6IFwicFwiLFxuICAgICAgcHJpY2VOb2RlOiBcInNwYW5cIixcbiAgICB9O1xuICB9XG4gIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIHN1cGVyLmNvbm5lY3RlZENhbGxiYWNrKCk7XG4gICAgdGhpcy5yZW5kZXJEYXRhKCk7XG4gIH1cblxuICByZW5kZXJEYXRhKCkge1xuICAgIHRoaXMuYnJhbmROb2RlLmlubmVyVGV4dCA9IHRoaXMucGFyZW50Tm9kZS5ob3N0LmJyYW5kO1xuICAgIHRoaXMudGl0bGVOb2RlLmlubmVyVGV4dCA9IHRoaXMucGFyZW50Tm9kZS5ob3N0LnRpdGxlO1xuICAgIHRoaXMuZGVzY3JpcHRpb25Ob2RlLmlubmVyVGV4dCA9IHRoaXMucGFyZW50Tm9kZS5ob3N0LmRlc2NyaXB0aW9uO1xuICAgIHRoaXMucHJpY2VOb2RlLmlubmVyVGV4dCA9IHRoaXMucGFyZW50Tm9kZS5ob3N0LnByaWNlO1xuICB9XG59XG5cbmNvbnN0IHRlbXBsYXRlID0gLyogaHRtbCAqLyBgXG48c3R5bGU+XG46aG9zdCB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgaW5zZXQ6IGF1dG8gMCAwO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS13aGl0ZSk7XG4gIGJvcmRlci10b3AtbGVmdC1yYWRpdXM6IHZhcigtLWJvcmRlci1yYWRpdXMpO1xuICBib3JkZXItdG9wLXJpZ2h0LXJhZGl1czogdmFyKC0tYm9yZGVyLXJhZGl1cyk7XG4gIGJveC1zaGFkb3c6IHZhcigtLWNhdGVnb3J5LWl0ZW0taG92ZXItc2hhZG93KTtcbiAgYmFja2dyb3VuZC1jb2xvcjogaHNsKDAgMCUgOTUlKTtcbiAgZGlzcGxheTogZ3JpZDtcbiAgZ3JpZC10ZW1wbGF0ZS1yb3dzOiBtaW4tY29udGVudDtcbiAgcm93LWdhcDogdmFyKC0tZ2FwKTtcbiAgZ3JpZC10ZW1wbGF0ZS1yb3dzOiBtaW4tY29udGVudCBtaW4tY29udGVudCAxZnIgbWluLWNvbnRlbnQgbWluLWNvbnRlbnQ7XG4gIGdyaWQtdGVtcGxhdGUtYXJlYXM6XG4gICAgXCJicmFuZFwiXG4gICAgXCJ0aXRsZVwiXG4gICAgXCJkZXNjcmlwdGlvblwiXG4gICAgXCJwcmljZVwiXG4gICAgXCJidXR0b25zXCI7XG4gIHBhZGRpbmc6IHZhcigtLWdhcCk7XG59XG46aG9zdCA+ICoge1xuICBwYWRkaW5nOiAwO1xuICBtYXJnaW46IDA7XG59XG5oNCB7XG4gIGdyaWQtYXJlYTogYnJhbmQ7XG59XG5oMyB7XG4gIGdyaWQtYXJlYTogdGl0bGU7XG59XG5wIHtcbiAgZ3JpZC1hcmVhOiBkZXNjcmlwdGlvbjtcbn1cbnNwYW4ge1xuICBncmlkLWFyZWE6IHByaWNlO1xuICB0ZXh0LWFsaWduOiByaWdodDtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gIGZvbnQtc2l6ZTogbGFyZ2VyO1xufVxuLmJ1dHRvbnMge1xuICBncmlkLWFyZWE6IGJ1dHRvbnM7XG4gIGRpc3BsYXk6IGdyaWQ7XG4gIGdyaWQtdGVtcGxhdGUtY29sdW1uczogcmVwZWF0KDIsIDFmcik7XG4gIGdhcDogdmFyKC0tZ2FwLXMpO1xufVxuLmJ1dHRvbnMgYnV0dG9uIHtcbiAgd2lkdGg6IDEwMCU7XG4gIGJvcmRlcjogbm9uZTtcbiAgYmFja2dyb3VuZDogdmFyKC0tYmxhY2spO1xuICBjb2xvcjogdmFyKC0td2hpdGUpO1xuICBwYWRkaW5nOiB2YXIoLS1nYXApIHZhcigtLWdhcC1sKTtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gIGZvbnQtc2l6ZTogbGFyZ2VyO1xufVxuLmJ1dHRvbnMgYnV0dG9uLmN0YSB7XG4gIGJhY2tncm91bmQ6IHZhcigtLWNsci1jdGEpO1xufVxuPC9zdHlsZT5cbjxoND48L2g0PlxuPGgzPjwvaDM+XG48cD48L3A+XG48c3BhbiBwYXJ0PVwicHJvZHVjdC10aWxlLXByaWNlXCI+PC9zcGFuPlxuPGRpdiBjbGFzcz1cImJ1dHRvbnNcIj5cbiAgICA8YnV0dG9uPkRldGFpbHM8L2J1dHRvbj5cbiAgICA8YnV0dG9uIGNsYXNzPVwiY3RhXCI+Q2FydDwvYnV0dG9uPlxuPC9kaXY+XG5gO1xuXG5BYnN0cmFjdENvbXBvbmVudC5pbml0Q29tcG9uZW50KFwiY2F0ZWdvcnktaXRlbS1ob3ZlclwiLCBIb3ZlciwgdGVtcGxhdGUpO1xuIiwgIi8vQHRzLW5vY2hlY2tcbmltcG9ydCB7IEFic3RyYWN0Q29tcG9uZW50IH0gZnJvbSBcIi4uLy4uL0Fic3RyYWN0Q29tcG9uZW50LmpzXCI7XG5cbi8qKlxuICogQHByb3BlcnR5IHtIVE1MRGl2RWxlbWVudH0gY29udGVudE5vZGVcbiAqIEBwcm9wZXJ0eSB7SFRNTFNsb3RFbGVtZW50fSBjb250ZW50U2xvdFxuICogQHByb3BlcnR5IHtBY2NvcmRpb25JdGVtfSBjbG9uZVxuICovXG5jbGFzcyBBY2NvcmRpb25JdGVtIGV4dGVuZHMgQWJzdHJhY3RDb21wb25lbnQge1xuICBzdGF0aWMgb2JzZXJ2ZWRBdHRyaWJ1dGVzID0gW1wiZGF0YS1vcGVuXCJdO1xuXG4gIC8qKiBAaW5oZXJpdGRvYyAqL1xuICBnZXQgZWxlbWVudHMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbnRlbnRTbG90OiBcImRpdi5jb250ZW50LXNsb3Qgc2xvdFwiLFxuICAgICAgY29udGVudE5vZGU6IFwiZGl2LmNvbnRlbnQtc2xvdFwiLFxuICAgIH07XG4gIH1cblxuICAvKiogQGluaGVyaXRkb2MgKi9cbiAgZ2V0IGxpc3RlbmVycygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgXCJkaXYubGFiZWwtc2xvdFwiOiB7XG4gICAgICAgIGNsaWNrOiB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpLFxuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZSByZW5kZXJcbiAgICovXG4gIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIGlmICghdGhpcy5jbGFzc0xpc3QuY29udGFpbnMoXCJjbG9uZVwiKSkge1xuICAgICAgc3VwZXIuY29ubmVjdGVkQ2FsbGJhY2soKTtcbiAgICAgIHRoaXMuZGF0YXNldC5vcGVuID0gdGhpcy5kYXRhc2V0Lm9wZW4gPz8gZmFsc2UudG9TdHJpbmcoKTtcbiAgICAgIHRoaXMuaW5pdENsb25lKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIGNsb25lIHNlbGYgYW5kIGhpZGUgaW4gb3BlbiBzdGF0ZVxuICAgKiBmb3IgbWVhc3VyaW5nIGhlaWdodFxuICAgKi9cbiAgaW5pdENsb25lKCkge1xuICAgIHRoaXMuY2xvbmUgPSBuZXcgQWNjb3JkaW9uSXRlbSgpO1xuICAgIHRoaXMuY2xvbmUuaW5uZXJIVE1MID0gdGhpcy5pbm5lckhUTUw7XG4gICAgdGhpcy5jbG9uZS5jbGFzc0xpc3QuYWRkKFwiY2xvbmVcIik7XG4gICAgdGhpcy5wYXJlbnROb2RlLmFwcGVuZENoaWxkKHRoaXMuY2xvbmUpO1xuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICB0aGlzLnN0eWxlLnNldFByb3BlcnR5KFxuICAgICAgICBcIi0taGVpZ2h0XCIsXG4gICAgICAgIHRoaXMuY2xvbmUuY29udGVudE5vZGUub2Zmc2V0SGVpZ2h0LnRvU3RyaW5nKClcbiAgICAgICk7XG4gICAgfSk7XG4gIH1cblxuICAvLyBub2luc3BlY3Rpb24gSlNVbnVzZWRHbG9iYWxTeW1ib2xzXG4gIC8qKlxuICAgKiBIYW5kbGUgYXR0cmlidXRlIGNoYW5nZVxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gb2xkVmFsdWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG5ld1ZhbHVlXG4gICAqL1xuICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgaWYgKCF0aGlzLmlzQ29ubmVjdGVkIHx8IG9sZFZhbHVlID09PSBuZXdWYWx1ZSkgcmV0dXJuO1xuICAgIGlmIChcImRhdGEtb3BlblwiID09PSBuYW1lKSB7XG4gICAgICB0aGlzLm9wZW4gPSBuZXdWYWx1ZSA9PT0gXCJ0cnVlXCI7XG4gICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwiY2hhbmdlXCIsIHsgZGV0YWlsOiB0aGlzIH0pKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogdHJpZ2dlciBoZWlnaHQgY2FsY3VsYXRpb25cbiAgICovXG4gIHVwZGF0ZSgpIHtcbiAgICBpZiAodGhpcy5vcGVuKSB7XG4gICAgICB0aGlzLnN0eWxlLnNldFByb3BlcnR5KFxuICAgICAgICBcIi0taGVpZ2h0XCIsXG4gICAgICAgIHRoaXMuY2xvbmUuY29udGVudE5vZGUub2Zmc2V0SGVpZ2h0LnRvU3RyaW5nKClcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZSBvcGVuIHN0YXRlXG4gICAqL1xuICB0b2dnbGUoKSB7XG4gICAgdGhpcy5vcGVuID0gIXRoaXMub3BlbjtcbiAgICB0aGlzLnVwZGF0ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIE9idGFpbiBvcGVuIHN0YXRlXG4gICAqIEByZXR1cm5zIHtCb29sZWFufVxuICAgKi9cbiAgZ2V0IG9wZW4oKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YXNldC5vcGVuID09PSBcInRydWVcIjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgb3BlbiBzdGF0ZVxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IHZcbiAgICovXG4gIHNldCBvcGVuKHYpIHtcbiAgICBpZiAodGhpcy5vcGVuICE9PSAhIXYpIHtcbiAgICAgIHRoaXMuZGF0YXNldC5vcGVuID0gKCEhdikudG9TdHJpbmcoKTtcbiAgICB9XG4gIH1cbn1cblxuLyogc3VwcHJlc3MgY3VzdG9tIHByb3BlcnRpZXMgZGVmaW5lZCBvdXRzaWRlIG9mIGVsZW1lbnQsIHNsb3QgaXMgbm90IHZhbGlkLCBkZWZhdWx0IHZhbHVlcyBmb3IgY3VzdG9tIHByb3BlcnRpZXMgKi9cbi8vIG5vaW5zcGVjdGlvbiBDc3NVbnJlc29sdmVkQ3VzdG9tUHJvcGVydHksQ3NzSW52YWxpZEh0bWxUYWdSZWZlcmVuY2UsQ3NzSW52YWxpZEZ1bmN0aW9uXG5jb25zdCB0ZW1wbGF0ZSA9IC8qIGh0bWwgKi8gYFxuPHN0eWxlPlxuOmhvc3Qge1xuICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgcG9zaXRpb246IHJlbGF0aXZlO1xufVxuZGl2LmxhYmVsLXNsb3Qge1xuICAgIGN1cnNvcjogdmFyKC0tY3Vyc29yLCBwb2ludGVyKTtcbn1cbjpob3N0KDpub3QoLmNsb25lKSkgZGl2LmNvbnRlbnQtc2xvdCB7XG4gICAgbWF4LWhlaWdodDogMDtcbn1cbmRpdi5jb250ZW50LXNsb3QsXG5kaXYuY29udGVudC1zbG90IHNsb3Q6OnNsb3R0ZWQoKikge1xuICAgIHRyYW5zaXRpb246IGFsbCB2YXIoLS10cmFuc2l0aW9uLWR1cmF0aW9uLCAyNTBtcykgdmFyKC0tdHJhbnNpdGlvbi10aW1pbmctZnVuY3Rpb24sIGVhc2UtaW4tb3V0KTtcbn1cbjpob3N0KDpub3QoLmNsb25lKVtkYXRhLW9wZW49XCJ0cnVlXCJdKSBkaXYuY29udGVudC1zbG90IHtcbiAgICBtYXgtaGVpZ2h0OiBjYWxjKHZhcigtLWhlaWdodCkgKiAxcHgpO1xufVxuOmhvc3QoOm5vdCguY2xvbmUpOm5vdChbZGF0YS1vcGVuPVwidHJ1ZVwiXSkpIGRpdi5jb250ZW50LXNsb3Qgc2xvdDo6c2xvdHRlZCgqKSB7XG4gICAgbWFyZ2luLWJsb2NrOiAwO1xufVxuOmhvc3QoLmNsb25lKSB7XG4gICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgIGxlZnQ6IC0yMDB2dztcbiAgICB3aWR0aDogMTAwJTtcbn1cbjwvc3R5bGU+XG48ZGl2IGNsYXNzPVwibGFiZWwtc2xvdFwiPjxzbG90IG5hbWU9XCJsYWJlbFwiPjwvc2xvdD48L2Rpdj5cbjxkaXYgY2xhc3M9XCJjb250ZW50LXNsb3RcIj48c2xvdD48L3Nsb3Q+PC9kaXY+XG5gO1xuXG5BYnN0cmFjdENvbXBvbmVudC5pbml0Q29tcG9uZW50KFwiYWNjb3JkaW9uLWl0ZW1cIiwgQWNjb3JkaW9uSXRlbSwgdGVtcGxhdGUpO1xuIiwgIi8vQHRzLW5vY2hlY2tcbmltcG9ydCB7IEFic3RyYWN0Q29tcG9uZW50IH0gZnJvbSBcIi4uLy4uL0Fic3RyYWN0Q29tcG9uZW50LmpzXCI7XG5pbXBvcnQgXCIuL0l0ZW0uanNcIjtcblxuLyoqXG4gQHByb3BlcnR5IHtIVE1MU2xvdEVsZW1lbnR9IGl0ZW1TbG90XG4gKi9cbmNsYXNzIEFjY29yZGlvbiBleHRlbmRzIEFic3RyYWN0Q29tcG9uZW50IHtcbiAgLyoqIEBpbmhlcml0ZG9jICovXG4gIGdldCBlbGVtZW50cygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaXRlbVNsb3Q6IFwic2xvdFwiLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZVxuICAgKi9cbiAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgc3VwZXIuY29ubmVjdGVkQ2FsbGJhY2soKTtcbiAgICBjb25zdCBldnRPcHRpb25zID0ge1xuICAgICAgc2lnbmFsOiB0aGlzLmRpc2Nvbm5lY3RlZFNpZ25hbCxcbiAgICB9O1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsICgpID0+IHRoaXMudXBkYXRlSXRlbUxpc3QoKSwgZXZ0T3B0aW9ucyk7XG4gICAgdGhpcy5pdGVtU2xvdC5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgXCJzbG90Y2hhbmdlXCIsXG4gICAgICAoKSA9PiB0aGlzLnVwZGF0ZUl0ZW1MaXN0KDApLFxuICAgICAgZXZ0T3B0aW9uc1xuICAgICk7XG4gICAgaWYgKCFzY3JlZW4ub3JpZW50YXRpb24pIHtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICBcIm9yaWVudGF0aW9uY2hhbmdlXCIsXG4gICAgICAgICgpID0+IHRoaXMudXBkYXRlSXRlbUxpc3QoKSxcbiAgICAgICAgZXZ0T3B0aW9uc1xuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2NyZWVuLm9yaWVudGF0aW9uLmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgIFwiY2hhbmdlXCIsXG4gICAgICAgICgpID0+IHRoaXMudXBkYXRlSXRlbUxpc3QoKSxcbiAgICAgICAgZXZ0T3B0aW9uc1xuICAgICAgKTtcbiAgICB9XG4gICAgdGhpcy5pdGVtQ2hhbmdlSGFuZGxlciA9IHRoaXMuaGFuZGxlSXRlbUNoYW5nZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuaXRlbXMuZm9yRWFjaCgoaSkgPT5cbiAgICAgIGkuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB0aGlzLml0ZW1DaGFuZ2VIYW5kbGVyLCBldnRPcHRpb25zKVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlIGl0ZW0gb3BlbiBzdGF0ZSBjaGFuZ2VcbiAgICpcbiAgICogQHBhcmFtIHtDdXN0b21FdmVudH0gZVxuICAgKiBAcGFyYW0ge0FjY29yZGlvbkl0ZW19IGUuZGV0YWlsXG4gICAqL1xuICBoYW5kbGVJdGVtQ2hhbmdlKGUpIHtcbiAgICB0aGlzLml0ZW1zLmZvckVhY2goKGkpID0+XG4gICAgICBpLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdGhpcy5pdGVtQ2hhbmdlSGFuZGxlcilcbiAgICApO1xuICAgIGlmIChlLmRldGFpbC5vcGVuICYmICF0aGlzLm11bHRpKSB7XG4gICAgICB0aGlzLml0ZW1zXG4gICAgICAgID8uZmlsdGVyKChpKSA9PiBpICE9PSBlLmRldGFpbClcbiAgICAgICAgLmZvckVhY2goKGkpID0+IChpLm9wZW4gPSBmYWxzZSkpO1xuICAgIH1cbiAgICB0aGlzLml0ZW1zLmZvckVhY2goKGkpID0+XG4gICAgICBpLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdGhpcy5pdGVtQ2hhbmdlSGFuZGxlciwge1xuICAgICAgICBzaWduYWw6IHRoaXMuZGlzY29ubmVjdGVkU2lnbmFsLFxuICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBsaXN0IG9mIGl0ZW1zXG4gICAqXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBkZWJvdW5jZVxuICAgKi9cbiAgdXBkYXRlSXRlbUxpc3QoZGVib3VuY2UgPSBudWxsKSB7XG4gICAgY29uc3QgdGltZW91dCA9IGRlYm91bmNlID8/IDUwO1xuICAgIGlmICh0aGlzLmRlYm91bmNlVGltZW91dCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuZGVib3VuY2VUaW1lb3V0KTtcbiAgICB9XG4gICAgdGhpcy5kZWJvdW5jZVRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuaXRlbXMuZm9yRWFjaCgoaSkgPT4gaS51cGRhdGUoKSk7XG4gICAgfSwgdGltZW91dCk7XG4gIH1cblxuICAvLyBub2luc3BlY3Rpb24gSlNVbnVzZWRHbG9iYWxTeW1ib2xzXG4gIC8qKlxuICAgKiBDbG9zZSBhbGwgaXRlbXMsIG1heWJlIHVzZWQgZm9yIGEgYnV0dG9uIHRvIGNsb3NlIGFsbCAobXVsdGkgb3BlbilcbiAgICovXG4gIGNsb3NlQWxsKCkge1xuICAgIHRoaXMuaXRlbXMuZm9yRWFjaCgoaSkgPT4gKGkub3BlbiA9IGZhbHNlKSk7XG4gIH1cblxuICAvKipcbiAgICogb2J0YWluIGl0ZW1zXG4gICAqIEByZXR1cm5zIHtBY2NvcmRpb25JdGVtW119XG4gICAqL1xuICBnZXQgaXRlbXMoKSB7XG4gICAgLyogc3VwcHJlc3MgdW5rbm93biBlbGVtZW50IGFjY29yZGlvbi1pdGVtICovXG4gICAgLy8gbm9pbnNwZWN0aW9uIEpTVmFsaWRhdGVUeXBlc1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMucXVlcnlTZWxlY3RvckFsbChcImFjY29yZGlvbi1pdGVtOm5vdCguY2xvbmUpXCIpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmUgaWYgYWNjb3JkaW9uIGNhbiBvcGVuIG11bHRpcGxlIHRhYnNcbiAgICogQHJldHVybnMge0Jvb2xlYW59XG4gICAqL1xuICBnZXQgbXVsdGkoKSB7XG4gICAgcmV0dXJuIFwidW5kZWZpbmVkXCIgIT09IHR5cGVvZiB0aGlzLmRhdGFzZXQubXVsdGk7XG4gIH1cbn1cblxuY29uc3QgdGVtcGxhdGUgPSAvKiBodG1sICovIGBcbjxzdHlsZT5cbjpob3N0IHtcbiAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgZGlzcGxheTogYmxvY2s7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbn1cbjwvc3R5bGU+XG48c2xvdD48L3Nsb3Q+XG5gO1xuXG5BYnN0cmFjdENvbXBvbmVudC5pbml0Q29tcG9uZW50KFwiYWNjb3JkaW9uLWJveFwiLCBBY2NvcmRpb24sIHRlbXBsYXRlKTtcbiIsICJpbXBvcnQgeyBBYnN0cmFjdENvbXBvbmVudCB9IGZyb20gXCIuLi9BYnN0cmFjdENvbXBvbmVudC5qc1wiO1xuXG5jbGFzcyBUb2RvIGV4dGVuZHMgQWJzdHJhY3RDb21wb25lbnQge1xuICAvKiogQGluaGVyaXRkb2MgKi9cbiAgZ2V0IGVsZW1lbnRzKCkge1xuICAgIHJldHVybiB7XG4gICAgICBidXR0b246IFwiYnV0dG9uXCIsXG4gICAgICBpbnB1dDogXCJpbnB1dFwiLFxuICAgIH07XG4gIH1cblxuICAvKiogQGluaGVyaXRkb2MgKi9cbiAgZ2V0IGxpc3RlbmVycygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnV0dG9uOiB7IGNsaWNrOiB0aGlzLmFkZEhhbmRsZXIuYmluZCh0aGlzKSB9LFxuICAgICAgaW5wdXQ6IHsga2V5ZG93bjogdGhpcy5hZGRIYW5kbGVyLmJpbmQodGhpcykgfSxcbiAgICB9O1xuICB9XG5cbiAgLyoqIEBpbmhlcml0ZG9jICovXG4gIGdldCBtdXRhdGlvbnMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJvb3Q6IFt7IGNoaWxkTGlzdDogKG0sIG8pID0+IHRoaXMudXBkYXRlQ291bnRlcihtLCBvKSB9XSxcbiAgICB9O1xuICB9XG5cbiAgZ2V0IG11dGF0aW9uT2JzZXJ2ZXJPcHRpb25zKCkge1xuICAgIHJldHVybiB7XG4gICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgY291bnRlclxuICAgKi9cbiAgdXBkYXRlQ291bnRlcigpIHtcbiAgICB0aGlzLnNoYWRvdy5xdWVyeVNlbGVjdG9yKFwiaDMgc3BhbjpmaXJzdC1vZi10eXBlXCIpLmlubmVySFRNTCA9IHRoaXMudG9kb3NcbiAgICAgIC5maWx0ZXIoKHQpID0+IHQuZG9uZSlcbiAgICAgIC5sZW5ndGgudG9TdHJpbmcoKTtcbiAgICB0aGlzLnNoYWRvdy5xdWVyeVNlbGVjdG9yKFwiaDMgc3BhbjpsYXN0LW9mLXR5cGVcIikuaW5uZXJIVE1MID1cbiAgICAgIHRoaXMudG9kb3MubGVuZ3RoLnRvU3RyaW5nKCk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlIGFkZCB0b2RvXG4gICAqIEBwYXJhbSB7TW91c2VFdmVudHxLZXlib2FyZEV2ZW50fSBlXG4gICAqL1xuICBhZGRIYW5kbGVyKGUpIHtcbiAgICBpZiAoZS50eXBlID09PSBcImtleWRvd25cIiAmJiBlLmNvZGUgIT09IFwiRW50ZXJcIikgcmV0dXJuO1xuICAgIGlmICh0aGlzLmlucHV0LnZhbGlkaXR5LnZhbGlkKSB7XG4gICAgICB0aGlzLmFkZFRvZG8odGhpcy5pbnB1dC52YWx1ZSk7XG4gICAgICB0aGlzLmlucHV0LnZhbHVlID0gXCJcIjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkIHRvZG9cbiAgICogQHBhcmFtIHtTdHJpbmd9IGxhYmVsXG4gICAqL1xuICBhZGRUb2RvKGxhYmVsKSB7XG4gICAgY29uc3QgaXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0b2RvLWl0ZW1cIik7XG4gICAgaXRlbS5kYXRhc2V0LmxhYmVsID0gbGFiZWw7XG4gICAgdGhpcy5hcHBlbmRDaGlsZChpdGVtKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPYnRhaW4gdG9kb3NcbiAgICogQHJldHVybnMge0FycmF5LjxPYmplY3QuPFN0cmluZzogbGFiZWwsIEJvb2xlYW46IGRvbmU+Pn1cbiAgICovXG4gIGdldCB0b2RvcygpIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLnF1ZXJ5U2VsZWN0b3JBbGwoXCJ0b2RvLWl0ZW1cIikpLm1hcCgoaSkgPT4ge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGFiZWw6IGkubGFiZWwsXG4gICAgICAgIGRvbmU6IGkuY2hlY2tlZCxcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRvZG9zXG4gICAqIEBwYXJhbSB7QXJyYXkuPFN0cmluZz59IHZcbiAgICovXG4gIHNldCB0b2Rvcyh2KSB7XG4gICAgdGhpcy5xdWVyeVNlbGVjdG9yQWxsKFwidG9kby1pdGVtXCIpLmZvckVhY2goKGkpID0+IGkuZGVsZXRlKCkpO1xuICAgIHYuZm9yRWFjaCgoaSkgPT4gdGhpcy5hZGRUb2RvKHYpKTtcbiAgfVxufVxuXG5Ub2RvLnByb3RvdHlwZS50ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZW1wbGF0ZVwiKTtcblRvZG8ucHJvdG90eXBlLnRlbXBsYXRlLmlubmVySFRNTCA9IC8qaHRtbCovIGBcbjxzdHlsZT5cbi5hZGQge1xuICBwYWRkaW5nOiB2YXIoLS1saXN0LWl0ZW0tcGFkZGluZyk7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGdhcDogdmFyKC0taXRlbS1wYWRkaW5nLWlubGluZSk7XG59XG48L3N0eWxlPlxuPGgyPjxzbG90IG5hbWU9XCJoZWFkZXJcIj5Zb3Ugc2hvdWxkIHNldCBhIGhlYWRlcjwvc2xvdD48L2gyPlxuPGgzPkRvbmU6IDxzcGFuPjwvc3Bhbj4gLyA8c3Bhbj48L3NwYW4+PC9oMz5cbjxzZWN0aW9uIGNsYXNzPVwiYWRkXCI+XG4gIDxpbnB1dCBwbGFjZWhvbGRlcj1cIlRvZG9cIiByZXF1aXJlZCBtaW49XCIzXCI+PGJ1dHRvbj5BZGQ8L2J1dHRvbj5cbjwvc2VjdGlvbj5cbjxzZWN0aW9uIGNsYXNzPVwiaXRlbXNcIj5cbiAgICA8c2xvdD48L3Nsb3Q+XG48L3NlY3Rpb24+XG5gO1xuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJ0b2RvLWxpc3RcIiwgVG9kbyk7XG4iLCAiaW1wb3J0IHsgQWJzdHJhY3RDb21wb25lbnQgfSBmcm9tIFwiLi4vQWJzdHJhY3RDb21wb25lbnQuanNcIjtcblxuY2xhc3MgSXRlbSBleHRlbmRzIEFic3RyYWN0Q29tcG9uZW50IHtcbiAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgcmV0dXJuIFtcImRhdGEtZG9uZVwiXTtcbiAgfVxuXG4gIC8qKiBAaW5oZXJpdGRvYyAqL1xuICBnZXQgZWxlbWVudHMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJ1dHRvbjogXCJidXR0b25cIixcbiAgICAgIGlucHV0OiBcImlucHV0XCIsXG4gICAgfTtcbiAgfVxuXG4gIC8qKiBAaW5oZXJpdGRvYyAqL1xuICBnZXQgbGlzdGVuZXJzKCkge1xuICAgIHJldHVybiB7XG4gICAgICBidXR0b246IHsgY2xpY2s6IHRoaXMuZGVsZXRlSGFuZGxlci5iaW5kKHRoaXMpIH0sXG4gICAgICBpbnB1dDogeyBjaGFuZ2U6IHRoaXMudXBkYXRlSGFuZGxlci5iaW5kKHRoaXMpIH0sXG4gICAgfTtcbiAgfVxuXG4gIC8qKiBAaW5oZXJpdGRvYyAqL1xuICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICBzdXBlci5jb25uZWN0ZWRDYWxsYmFjaygpO1xuICAgIHRoaXMubGFiZWwgPSB0aGlzLmRhdGFzZXQubGFiZWw7XG4gICAgdGhpcy5jaGVja2VkID0gdGhpcy5kYXRhc2V0LmRvbmUgPT09IFwidHJ1ZVwiO1xuICAgIHRoaXMucGFyZW50Tm9kZS51cGRhdGVDb3VudGVyKCk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlIGF0dHJpYnV0ZSBjaGFuZ2VcbiAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9sZFZhbHVlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuZXdWYWx1ZVxuICAgKi9cbiAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgIGlmICghdGhpcy5pbnB1dCB8fCBvbGRWYWx1ZSA9PT0gbmV3VmFsdWUpIHJldHVybjtcbiAgICBpZiAoXCJkYXRhLWRvbmVcIiA9PT0gbmFtZSkge1xuICAgICAgdGhpcy5jaGVja2VkID0gbmV3VmFsdWUgPT09IFwidHJ1ZVwiO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVcbiAgICovXG4gIHVwZGF0ZUhhbmRsZXIoKSB7XG4gICAgdGhpcy5kYXRhc2V0LmRvbmUgPSB0aGlzLmNoZWNrZWQudG9TdHJpbmcoKTtcbiAgICB0aGlzLnRvZ2dsZUxpbmVUaHJvdWdoKCk7XG4gICAgdGhpcy5wYXJlbnROb2RlLnVwZGF0ZUNvdW50ZXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGVcbiAgICovXG4gIGRlbGV0ZUhhbmRsZXIoKSB7XG4gICAgdGhpcy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMpO1xuICB9XG5cbiAgdG9nZ2xlTGluZVRocm91Z2goKSB7XG4gICAgdGhpcy5pbnB1dC5wYXJlbnROb2RlLmNsYXNzTGlzdC50b2dnbGUoXCJkb25lXCIsIHRoaXMuY2hlY2tlZCk7XG4gIH1cblxuICAvKipcbiAgICogT2J0YWluIGNoZWtlZCBzdGF0ZVxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICovXG4gIGdldCBjaGVja2VkKCkge1xuICAgIHJldHVybiB0aGlzLmlucHV0LmNoZWNrZWQ7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGNoZWNrZWQgc3RhdGVcbiAgICogQHBhcmFtIHtCb29sZWFufSB2XG4gICAqL1xuICBzZXQgY2hlY2tlZCh2KSB7XG4gICAgaWYgKHRoaXMuY2hlY2tlZCAhPT0gISF2KSB7XG4gICAgICB0aGlzLmlucHV0LmNoZWNrZWQgPSAhIXY7XG4gICAgICB0aGlzLnRvZ2dsZUxpbmVUaHJvdWdoKCk7XG4gICAgICB0aGlzLmlucHV0LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwiY2hhbmdlXCIpKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogT2J0YWluIGxhYmVsXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9XG4gICAqL1xuICBnZXQgbGFiZWwoKSB7XG4gICAgcmV0dXJuIHRoaXMuc2hhZG93LnF1ZXJ5U2VsZWN0b3IoXCJsYWJlbCBzcGFuXCIpLmlubmVySFRNTDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgbGFiZWxcbiAgICogQHBhcmFtIHtTdHJpbmd9IHZcbiAgICovXG4gIHNldCBsYWJlbCh2KSB7XG4gICAgdGhpcy5zaGFkb3cucXVlcnlTZWxlY3RvcihcImxhYmVsIHNwYW5cIikuaW5uZXJIVE1MID0gdjtcbiAgfVxufVxuXG5JdGVtLnByb3RvdHlwZS50ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZW1wbGF0ZVwiKTtcbkl0ZW0ucHJvdG90eXBlLnRlbXBsYXRlLmlubmVySFRNTCA9IC8qIGh0bWwgKi8gYFxuPHN0eWxlPlxuOmhvc3Qge1xuICBkaXNwbGF5OiBmbGV4O1xuICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gIGJhY2tncm91bmQ6IHZhcigtLWNsci1iZy1saXN0LWl0ZW0pO1xuICBwYWRkaW5nOiB2YXIoLS1saXN0LWl0ZW0tcGFkZGluZyk7XG59XG46aG9zdCg6aG92ZXIpIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogdmFyKC0tY2xyLWJnLWxpc3QtaXRlbS1ob3Zlcik7XG59XG5sYWJlbC5kb25lIHNwYW4ge1xuICB0ZXh0LWRlY29yYXRpb246IGxpbmUtdGhyb3VnaDtcbn1cbjwvc3R5bGU+XG48bGFiZWw+XG4gICAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiPlxuICAgIDxzcGFuPjwvc3Bhbj5cbjwvbGFiZWw+XG48YnV0dG9uPkRlbGV0ZTwvYnV0dG9uPlxuYDtcblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwidG9kby1pdGVtXCIsIEl0ZW0pO1xuIiwgImltcG9ydCB7IEFic3RyYWN0Q29tcG9uZW50IH0gZnJvbSBcIi4vQWJzdHJhY3RDb21wb25lbnQuanNcIjtcbmNsYXNzIE15Q29tcG9uZW50IGV4dGVuZHMgQWJzdHJhY3RDb21wb25lbnQge1xuICBnZXQgZWxlbWVudHMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG15OiBcIi5teUVsZW1lbnRcIixcbiAgICAgIGJ1dHRvbjogXCIuYnV0dG9uXCIsXG4gICAgfTtcbiAgfVxuICBnZXQgbGlzdGVuZXJzKCkge1xuICAgIHJldHVybiB7XG4gICAgICBcIi5idXR0b25cIjoge1xuICAgICAgICBjbGljazogKGUpID0+XG4gICAgICAgICAgdGhpcy5teS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIiBhcmUgYXdlc29tZSEhXCIpKSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuICBnZXQgbXV0YXRpb25zKCkge1xuICAgIHJldHVybiB7XG4gICAgICBteTogW1xuICAgICAgICB7IGNoaWxkTGlzdDogKG0sIG8pID0+IGNvbnNvbGUubG9nKG0pIH0sXG4gICAgICAgIHsgY2hpbGRMaXN0OiAobSwgbykgPT4gY29uc29sZS5sb2cobykgfSxcbiAgICAgICAgeyBjaGlsZExpc3Q6IFwiVGhpcyByYWlzZXMgYW4gZXJyb3JcIiB9LFxuICAgICAgXSxcbiAgICAgIGJ1dHRvbjogW3sgY2hpbGRMaXN0OiAobSwgbykgPT4gY29uc29sZS5sb2cobSwgbykgfV0sXG4gICAgfTtcbiAgfVxuICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICBzdXBlci5jb25uZWN0ZWRDYWxsYmFjaygpO1xuICAgIGNvbnNvbGUubG9nKHRoaXMubXkpO1xuICB9XG59XG5NeUNvbXBvbmVudC5wcm90b3R5cGUudGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGVtcGxhdGVcIik7XG5NeUNvbXBvbmVudC5wcm90b3R5cGUudGVtcGxhdGUuaW5uZXJIVE1MID0gLyogaHRtbCAqLyBgXG48YnV0dG9uIGNsYXNzPVwiYnV0dG9uXCI+Q2xpY2shPC9idXR0b24+XG48ZGl2IGNsYXNzPVwibXlFbGVtZW50XCI+XG4gICAgV2ViIENvbXBvbmVudHNcbjwvZGl2PlxuYDtcbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcIm15LWNvbXBvbmVudFwiLCBNeUNvbXBvbmVudCk7XG4iLCAiZXhwb3J0IGNsYXNzIFJvdXRlciB7XG4gICNfcm91dGVzID0gW107XG4gICNfaW5pdGlhbCA9IFwiL1wiO1xuICAjX2N1cnJlbnQgPSBcIi9cIjtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmN1cnJlbnQgPSBsb2NhdGlvbi5wYXRobmFtZTtcbiAgICB0aGlzLmluaXRpYWwgPSB0aGlzLmN1cnJlbnQ7XG4gICAgdGhpcy5hYm9ydENvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gICAgdGhpcy5hYm9ydFNpZ25hbCA9IHRoaXMuYWJvcnRDb250cm9sbGVyLnNpZ25hbDtcbiAgICBhZGRFdmVudExpc3RlbmVyKFwicG9wc3RhdGVcIiwgKGUpID0+IHRoaXMuaGFuZGxlSGlzdG9yeVBvcChlKSk7XG4gIH1cblxuICAvKipcbiAgICogRGVmaW5lIHJvdXRlc1xuICAgKiBAcGFyYW0ge1N0cmluZ30gcm91dGVcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAgICovXG4gIHJvdXRlKHJvdXRlID0gXCIvXCIsIGNiID0gKCkgPT4ge30pIHtcbiAgICB0aGlzLnJvdXRlcy5wdXNoKHsgcm91dGUsIGNiIH0pO1xuICAgIHRoaXMuYWRkTGlzdGVuZXIocm91dGUsIGNiKTtcbiAgfVxuXG4gIGFkZExpc3RlbmVyKHJvdXRlLCBjYikge1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYFtocmVmPVwiLyR7cm91dGV9XCJdYCkuZm9yRWFjaCgobm9kZSkgPT4ge1xuICAgICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICBcImNsaWNrXCIsXG4gICAgICAgIChlKSA9PiB7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHRoaXMucHVzaChyb3V0ZSk7XG4gICAgICAgICAgY2IoKTtcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHNpZ25hbDogdGhpcy5hYm9ydFNpZ25hbCxcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFkZExpc3RlbmVycygpIHtcbiAgICB0aGlzLnJvdXRlcy5mb3JFYWNoKChpKSA9PiB0aGlzLmFkZExpc3RlbmVyKGkucm91dGUsIGkuY2IpKTtcbiAgfVxuXG4gIHB1c2gocm91dGUpIHtcbiAgICBoaXN0b3J5LnB1c2hTdGF0ZShyb3V0ZSwgXCJcIiwgcm91dGUpO1xuICB9XG5cbiAgaGFuZGxlSGlzdG9yeVBvcChlKSB7XG4gICAgdGhpcy5hYm9ydENvbnRyb2xsZXIuYWJvcnQoKTtcbiAgICBpZiAobG9jYXRpb24ucGF0aG5hbWUgPT09IHRoaXMuaW5pdGlhbCkge1xuICAgICAgLy8gV2UgcmVsb2FkIHRoZSBwYWdlIHNpbmNlIHdlIGNhbm5vdCBrbm93IGhvdyB0byByZWNyZWF0ZSB0aGlzIHZpZXdcbiAgICAgIGxvY2F0aW9uLnJlbG9hZCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBydW4gdGhlIGFzc2lvY2lhdGVkIGNhbGxiYWNrIG90aGVyd2lzZVxuICAgICAgdGhpcy5yb3V0ZXMuZmluZCgocikgPT4gZS5zdGF0ZSA9PT0gci5yb3V0ZSk/LmNiPy4oKTtcbiAgICB9XG4gIH1cblxuICBnZXQgaW5pdGlhbCgpIHtcbiAgICByZXR1cm4gdGhpcy4jX2luaXRpYWw7XG4gIH1cbiAgc2V0IGluaXRpYWwodikge1xuICAgIHRoaXMuI19pbml0aWFsID0gdjtcbiAgfVxuXG4gIGdldCByb3V0ZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuI19yb3V0ZXM7XG4gIH1cbiAgc2V0IHJvdXRlcyh2KSB7XG4gICAgdGhpcy4jX3JvdXRlcyA9IHY7XG4gIH1cblxuICBnZXQgY3VycmVudCgpIHtcbiAgICByZXR1cm4gdGhpcy4jX2N1cnJlbnQ7XG4gIH1cbiAgc2V0IGN1cnJlbnQodikge1xuICAgIHRoaXMuI19jdXJyZW50ID0gdjtcbiAgfVxufVxuIiwgImltcG9ydCBcIi4vQ29tcG9uZW50cy9DYXRlZ29yeS9pbmRleC5qc1wiO1xuXG5jb25zdCBjbGVhckJvZHkgPSAoKSA9PiB7XG4gIGRvY3VtZW50LmJvZHlcbiAgICAucXVlcnlTZWxlY3RvckFsbChcIjpzY29wZSA+ICpcIilcbiAgICAuZm9yRWFjaCgobikgPT4gZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChuKSk7XG59O1xuXG5leHBvcnQgY29uc3QgaW5pdCA9IChyb3V0ZXIpID0+IHtcbiAgcm91dGVyLnJvdXRlKFwicm91dGVyLXRlc3RcIiwgKCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKFwiUm91dGVkIHRvIHJvdXRlci10ZXN0XCIpO1xuICAgIGNsZWFyQm9keSgpO1xuICAgIGNvbnN0IG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2F0ZWdvcnktbGlzdFwiKTtcbiAgICBub2RlLmRhdGFzZXQucHdhID0gXCJ0cnVlXCI7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChub2RlKTtcbiAgfSk7XG59O1xuIiwgImltcG9ydCBcIi4vQ29tcG9uZW50cy9idWlsZC5qc1wiO1xuaW1wb3J0IHsgUm91dGVyIH0gZnJvbSBcIi4vUm91dGVyLmpzXCI7XG5pbXBvcnQgeyBpbml0IGFzIGluaXRSb3V0ZXMgfSBmcm9tIFwiLi9yb3V0ZXMuanNcIjtcblxuY29uc3Qgcm91dGVyID0gbmV3IFJvdXRlcigpO1xuaW5pdFJvdXRlcyhyb3V0ZXIpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7O0FBQUEsTUFBTSw0QkFBNEI7QUFBQSxJQUNoQyxTQUFTO0FBQUEsSUFDVCxZQUFZO0FBQUEsSUFDWixXQUFXO0FBQUEsSUFDWCxlQUFlO0FBQUEsSUFDZix1QkFBdUI7QUFBQSxFQUN6QjtBQUVPLE1BQU0sb0JBQU4sY0FBZ0MsWUFBWTtBQUFBLElBQ2pELGNBQWM7QUFDWixZQUFNO0FBQ04sV0FBSyxTQUFTLEtBQUssYUFBYSxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQ2xELFdBQUssT0FBTyxZQUFZLEtBQUssU0FBUyxRQUFRLFVBQVUsSUFBSSxDQUFDO0FBQzdELFdBQUssYUFBYTtBQUFBLElBQ3BCO0FBQUEsSUFLQSxvQkFBb0I7QUFDbEIsV0FBSyx1QkFBdUIsSUFBSSxnQkFBZ0I7QUFDaEQsV0FBSyxxQkFBcUIsS0FBSyxxQkFBcUI7QUFDcEQsV0FBSyxhQUFhO0FBQUEsSUFDcEI7QUFBQSxJQU1BLHVCQUF1QjtBQUNyQixXQUFLLHFCQUFxQixNQUFNO0FBQ2hDLFdBQUssZ0JBQWdCO0FBQUEsSUFDdkI7QUFBQSxJQU1BLGVBQWU7QUFDYixpQkFBVyxZQUFZLE9BQU8sS0FBSyxLQUFLLFFBQVEsR0FBRztBQUNqRCxjQUFNLFFBQVEsTUFBTTtBQUFBLFVBQ2xCLEtBQUssT0FBTyxpQkFBaUIsS0FBSyxTQUFTLFNBQVM7QUFBQSxRQUN0RDtBQUNBLGFBQUssWUFBWSxPQUFPLFdBQVcsSUFBSSxNQUFNLEtBQUs7QUFBQSxNQUNwRDtBQUNBLGFBQU87QUFBQSxJQUNUO0FBQUEsSUFNQSxlQUFlO0FBQ2IsYUFBTyxLQUFLLFVBQVUsRUFBRSxhQUFhO0FBQUEsSUFDdkM7QUFBQSxJQU1BLFlBQVk7QUFDVixpQkFBVyxZQUFZLE9BQU8sS0FBSyxLQUFLLFNBQVMsR0FBRztBQUNsRCxjQUFNLFNBQVMsS0FB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LE9BQU87QUFFTCxhQUFLLE9BQU8sS0FBSyxDQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsS0FBSyxHQUFHLEtBQUs7QUFBQSxNQUNyRDtBQUFBLElBQ0Y7QUFBQSxJQUVBLElBQUksVUFBVTtBQUNaLGFBQU8sS0FBSztBQUFBLElBQ2Q7QUFBQSxJQUNBLElBQUksUUFBUSxHQUFHO0FBQ2IsV0FBSyxZQUFZO0FBQUEsSUFDbkI7QUFBQSxJQUVBLElBQUksU0FBUztBQUNYLGFBQU8sS0FBSztBQUFBLElBQ2Q7QUFBQSxJQUNBLElBQUksT0FBTyxHQUFHO0FBQ1osV0FBSyxXQUFXO0FBQUEsSUFDbEI7QUFBQSxJQUVBLElBQUksVUFBVTtBQUNaLGFBQU8sS0FBSztBQUFBLElBQ2Q7QUFBQSxJQUNBLElBQUksUUFBUSxHQUFHO0FBQ2IsV0FBSyxZQUFZO0FBQUEsSUFDbkI7QUFBQSxFQUNGOzs7QUM1RUEsTUFBTSxZQUFZLE1BQU07QUFDdEIsYUFBUyxLQUNOLGlCQUFpQixZQUFZLEVBQzdCLFFBQVEsQ0FBQyxNQUFNLFNBQVMsS0FBSyxZQUFZLENBQUMsQ0FBQztBQUFBLEVBQ2hEO0FBRU8sTUFBTSxPQUFPLENBQUNDLFlBQVc7QUFDOUIsSUFBQUEsUUFBTyxNQUFNLGVBQWUsTUFBTTtBQUNoQyxjQUFRLElBQUksdUJBQXVCO0FBQ25DLGdCQUFVO0FBQ1YsWUFBTSxPQUFPLFNBQVMsY0FBYyxlQUFlO0FBQ25ELFdBQUssUUFBUSxNQUFNO0FBQ25CLGVBQVMsS0FBSyxZQUFZLElBQUk7QUFBQSxJQUNoQyxDQUFDO0FBQUEsRUFDSDs7O0FDWkEsTUFBTSxTQUFTLElBQUksT0FBTztBQUMxQixPQUFXLE1BQU07IiwKICAibmFtZXMiOiBbInRlbXBsYXRlIiwgInRlbXBsYXRlIiwgInRlbXBsYXRlIiwgInRlbXBsYXRlIiwgInRlbXBsYXRlIiwgIkl0ZW0iLCAicm91dGVyIl0KfQo=
