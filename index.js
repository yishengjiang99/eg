import { wasmbin } from "./eg.wasm.js";
const module = new WebAssembly.Module(wasmbin);
export function EnvelopeGenerator() {
  const heap = new WebAssembly.Memory({ initial: 10, maximum: 10 });
  const instance = new WebAssembly.Instance(module, {
    env: { memory: heap, fpower: (b, e) => Math.pow(b, e) },
  });

  return {
    exports: instance.exports,
    heap,
    mkEG: function (a, d, s, r, sr = 48000) {
      const ref = instance.exports.init_eg(a, d, s, r, sr);
      const dv = new DataView(heap.buffer, ref, 24);
      return {
        att_rate_db: dv.getFloat32(0, true),
        decay_rate: dv.getFloat32(4, true),
        release_rate: dv.getFloat32(8, true),
        centible: dv.getFloat32(12, true),
        egval: dv.getFloat32(16, true),
        sr: dv.getInt32(20, true),
        roll(n = 128) {
          const ob = instance.exports.process(ref, n);
          return new Float32Array(heap.buffer, ob, n);
        },
        release() {
          instance.exports.release(ref, r);
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

let worker;

export async function mkEGWorker(a, d, s, r, sr = 48000) {
  const BufferState_UPDATE_PROVIDED = 0;
  const BufferState_UPDATE_REQUESTED = 1;
  const BufferState_RELEASETRIGGERED = 3;
  const BufferState_RESET = 4;
  const BufferState_ENDED = 8;
  worker = worker || new Worker("egworker.js", { type: "module" });
  worker.postMessage({ params: new Int32Array([a, d, s, r, sr]) });
  const sharedBuffer = await new Promise((resolve) => {
    worker.onmessage = ({ data }) => {
      const sharedBuffer = data;
      console.log(data);
      resolve(sharedBuffer);
    };
  });
  const stateBuffer = new Int32Array(sharedBuffer, 0, 8);
  const ob = new Float32Array(sharedBuffer, 32, 128);
  console.assert(stateBuffer[0] == BufferState_UPDATE_PROVIDED);

  function roll(destinationBuffer = new Float32Array(128)) {
    if (Atomics.load(stateBuffer, 0) != BufferState_UPDATE_PROVIDED) {
      console.log("skipping frame");
    }

    destinationBuffer.set(ob, 0, 128);
    Atomics.store(stateBuffer, 0, BufferState_UPDATE_REQUESTED);
    Atomics.notify(stateBuffer, 0, 1);
    return destinationBuffer;
  }
  function release() {
    Atomics.store(stateBuffer, 0, BufferState_RELEASETRIGGERED);
    Atomics.notify(stateBuffer, 0, 1);
  }
  function reset() {
    Atomics.store(stateBuffer, 0, BufferState_RESET);
    Atomics.notify(stateBuffer, 0, 1);
  }
  function done() {
    Atomics.store(stateBuffer, 0, BufferState_ENDED);
    Atomics.notify(stateBuffer, 0, 1);
  }
  return {
    roll,
    release,
    reset,
    done,
  };
}
export function mkEGWorkerMetricSystem(a, d, s, r, sr = 48000) {
  worker = worker || new Worker("egworker.js", { type: "module" });
  const params = [a, d, s, r].map((v) => 1200 * Math.log2(v));
  return mkEGWorker(...params, sr);
}
