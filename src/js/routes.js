import "./Components/Category/index.js";

const clearBody = () => {
  document.body
    .querySelectorAll(":scope > *")
    .forEach((n) => document.body.removeChild(n));
};

export const init = (router) => {
  router.route("router-test", () => {
    console.log("Routed to router-test");
    clearBody();
    const node = document.createElement("category-list");
    node.dataset.pwa = "true";
    document.body.appendChild(node);
  });
};
