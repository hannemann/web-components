import { AbstractComponent } from "../Abstract.js";

class Item extends AbstractComponent {
  #_data = null;
  static get observedAttributes() {
    return ["data-img", "data-brand", "data-title", "data-price"];
  }
  get elements() {
    return {
      imgNode: "figure img",
      brandNode: ".product-data h4",
      titleNode: ".product-data h3",
      priceNode: ".product-data span",
    };
  }

  /**
   * Handle attribute change
   * @param {String} name
   * @param {String} oldValue
   * @param {String} newValue
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
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
  }

  /**
   * @param {String} v
   */
  set productData(data) {
    this.#_data = data;
    this.title = data.title;
    this.brand = data.brand;
    this.price = data.price;
    this.img = data.img;
  }

  /**
   * @param {String} v
   */
  get productData() {
    return this.#_data;
  }

  /**
   * @return {String}
   */
  get img() {
    return this.dataset.img;
  }

  /**
   * @param {String} v
   */
  set img(v) {
    this.dataset.img = v.toString();
  }

  /**
   * @return {String}
   */
  get title() {
    return this.dataset.title;
  }

  /**
   * @param {String} v
   */
  set title(v) {
    this.dataset.title = v.toString();
  }

  /**
   * @return {String}
   */
  get brand() {
    return this.dataset.brand;
  }

  /**
   * @param {String} v
   */
  set brand(v) {
    this.dataset.brand = v.toString();
  }

  /**
   * @return {String}
   */
  get price() {
    return parseFloat(this.dataset.price).toFixed(2);
  }

  /**
   * @param {Number} v
   */
  set price(v) {
    this.dataset.price = v.toString();
  }
}

const template = /* html */ `
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
<figure><img loading="lazy"></figure>
<div class="product-data">
    <h4></h4>
    <h3></h3>
    <span></span>
</div>
<category-item-hover></category-item-hover>
`;

AbstractComponent.initComponent("category-item", Item, template);
