import { AbstractComponent } from "../Abstract.js";

class Item extends AbstractComponent {
  get elements() {
    return {
      img: "figure img",
      name: ".product-data h3",
      description: ".product-data p",
      price: ".product-data span",
    };
  }
  set productData(data) {
    this._data = data;
    this.img.src = data.url;
    this.name.innerText = data.name;
    this.description.innerText = data.title;
    this.price.innerText = data.price;
  }

  get productData() {
    return this._data;
  }
}

const template = /* html */ `
<link rel="stylesheet" href="/css/components/Category/Item.css">
<figure><img></figure>
<div class="product-data">
    <h3></h3>
    <p></p>
    <span></span>
</div>
`;

AbstractComponent.initComponent("category-item", Item, template);
