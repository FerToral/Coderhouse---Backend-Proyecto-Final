import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { sameOrigin } from "../../src/utils/connect-socket.js";
test("chat: compara el origen también para WebSocket", () => {
  const req = (origin) => ({
    headers: { host: "localhost:8000", ...(origin ? { origin } : {}) },
  });
  assert.equal(sameOrigin(req("http://localhost:8000")), true);
  assert.equal(sameOrigin(req("https://external.invalid")), false);
  assert.equal(sameOrigin(req("null")), false);
  assert.equal(sameOrigin(req()), true);
});
test("chat: cliente muestra HTML malicioso usando nodos de texto", () => {
  const handlers = {},
    nodes = {};
  function node() {
    return {
      textContent: "",
      children: [],
      append(...items) {
        this.children.push(...items);
      },
      replaceChildren(fragment) {
        this.children = fragment.children;
      },
      addEventListener() {},
      querySelector() {
        return node();
      },
    };
  }
  const document = {
    getElementById(id) {
      return (nodes[id] ??= node());
    },
    createDocumentFragment: node,
    createElement: node,
  };
  const socket = {
    on(name, fn) {
      handlers[name] = fn;
    },
  };
  const source = readFileSync(
    new URL("../../src/public/js/chat.js", import.meta.url),
    "utf8",
  );
  assert.equal(source.includes("innerHTML"), false);
  vm.runInNewContext(source, { document, io: () => socket });
  const payload = '<img src=x onerror="alert(1)">';
  handlers.all_msgs([{ user: payload, message: payload }]);
  assert.equal(nodes["div-msgs"].children[0].children[0].textContent, payload);
  assert.equal(nodes["div-msgs"].children[0].children[1].textContent, payload);
});
