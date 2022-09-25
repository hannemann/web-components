export class Route {
  #_path = "/";
  #_cb = () => {};
  #_method = "GET";

  get path() {
    return this.#_path;
  }
  set path(v) {
    this.#_path = v;
  }

  get callback() {
    return this.#_cb;
  }
  set callback(v) {
    this.#_cb = v;
  }

  get method() {
    return this.#_method;
  }
  set method(v) {
    this.#_method = v;
  }
}
