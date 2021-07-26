import { wasmbin } from "./eg.wasm.js";

const module = new WebAssembly.Module(wasmbin);
export function EnvelopeGenerator(byoh) {
  const heap = byoh || new WebAssembly.Memory({ initial: 10, maximum: 10 });
  const instance = new WebAssembly.Instance(module, {
    env: { memory: heap, fpower: (b, e) => Math.pow(b, e) },
  });
  return {
    exports: instance.exports,
    heap,
    mkEG: function (a, d, s, r) {
      const ref = instance.exports.init_eg(a, d, s, r);
      const dv = new DataView(heap.buffer, ref, 20);
      return {
        att_rate_db: dv.getFloat32(0, true),
        decay_rate: dv.getFloat32(4, true),
        release_rate: dv.getFloat32(8, true),
        centible: dv.getFloat32(12, true),
        egval: dv.getFloat32(16, true),
        roll() {
          const ob = instance.exports.process(ref);
          return new Float32Array(heap.buffer, ob, 128);
        },
        release() {
          instance.exports.release(ref);
        },
      };
    },
    eg: function (ref) {
      const dv = new DataView(heap.buffer, ref, 32);

      return {
        att_rate_db: dv.getFloat32(0, true),
        decay_rate: dv.getFloat32(4, true),
        release_rate: dv.getFloat32(8, true),
        centible: dv.getFloat32(12, true),
        egval: dv.getFloat32(16, true),
      };
    },
  };
}
