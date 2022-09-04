import { AbstractComponent } from "../Abstract.js";

const ITEMS_COUNT = 24;
// const ITEMS_URL = "https://jsonplaceholder.typicode.com/photos";
const ITEMS_URL = "https://dummyjson.com/products";

class List extends AbstractComponent {
  get elements() {
    return {
      items: ".items",
    };
  }
  #_products = [];
  async connectedCallback() {
    console.time("Category");
    super.connectedCallback();
    try {
      const items = await this.load();
      this.initProducts(items);
      this.render();
    } catch (error) {
      console.error(error);
    }
    console.timeEnd("Category");
  }

  async load() {
    console.groupCollapsed("Start load timer.");
    console.time("load");
    const response = await fetch(ITEMS_URL);
    const result = await response.json();
    console.timeLog("load", "...Data fetched");
    const items = result?.products?.slice(0, ITEMS_COUNT).map((p) => {
      return {
        ...p,
        ...{
          img: p.images[0],
        },
      };
    });
    console.timeLog("load", "...data decorated.");
    console.timeEnd("load");
    console.groupEnd();
    return items;
  }

  initProducts(items) {
    console.groupCollapsed("Creating product tiles...");
    console.time("initProducts");
    items.forEach((p) => {
      const node = document.createElement("category-item");
      node.productData = p;
      this.products.push(node);
    });
    console.log(`...${ITEMS_COUNT} product tiles created`);
    console.timeEnd("initProducts");
    console.groupEnd();
  }

  render() {
    console.groupCollapsed("Render tiles");
    console.time("render");
    this.products.forEach((p) => this.items.appendChild(p));
    console.log(`${ITEMS_COUNT} product tiles rendered`);
    console.timeEnd("render");
    console.groupEnd();
  }

  get products() {
    return this.#_products;
  }
}

const template = /* html */ `
<style>
.items {
  display: grid;
  gap: var(--gap-l);
  grid-template-columns: repeat(auto-fit, minmax(var(--product-tile-width), 1fr));
  grid-auto-flow: dense;
}
</style>
<h2>Category</h2>
<div class="items"></div>
`;

AbstractComponent.initComponent("category-list", List, template);
