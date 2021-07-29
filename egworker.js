import { wasmbin } from "./eg.wasm.js";
/* eslint-disable no-constant-condition */
const heap = new WebAssembly.Memory({ initial: 10, maximum: 10 });
const instance = new WebAssembly.Instance(new WebAssembly.Module(wasmbin), {
  env: { memory: heap, fpower: (b, e) => Math.pow(b, e) },
});

const bufferState_UpdateProvided = 0;
const BufferState_UpdateNeeded = 1;
const BufferState_RELEASETRIGGERED = 3;
const BufferState_RESET = 4;
const BufferState_ENDED = 8;

const srbOFfset = new Uint16Array([0]);
const srb = new SharedArrayBuffer(0xffff);
const bufferlength = (n) =>
  n * Float32Array.BYTES_PER_ELEMENT + 8 * Uint32Array.BYTES_PER_ELEMENT;

onmessage = (e) => {
  console.log(e);
  let [a, d, s, r, sampleRate = 48000, len = 128] = e.data.params;

  const sharedBuffer = srb.slice(
    srbOFfset[0],
    srbOFfset[0] + bufferlength(len)
  );
  const stateBuffer = new Int32Array(sharedBuffer, 0, 8);
  srbOFfset[0] += bufferlength(len);

  const ob = new Float32Array(sharedBuffer, stateBuffer.length, len);
  let ref = instance.exports.init_eg(a, d, s, r, sampleRate);
  Atomics.store(stateBuffer, 0, BufferState_UpdateNeeded);

  processThenWait();
  postMessage(sharedBuffer);
  function processThenWait() {
    const prompt = Atomics.load(stateBuffer, 0);
    if (prompt & BufferState_ENDED) return;
    if (prompt & BufferState_RELEASETRIGGERED) instance.exports.release(ref, r);
    if (prompt & BufferState_RESET) {
      [a, d, s, r, len, sampleRate] = stateBuffer.subarray(2, 8);
      ref = instance.exports.init_eg(a, d, s, r, sampleRate);
    }
    if (prompt & BufferState_UpdateNeeded) {
      ob.set(new Float32Array(heap.buffer, instance.exports.process(ref), 128));
      Atomics.store(stateBuffer, 0, bufferState_UpdateProvided);
    }

    const result = Atomics.waitAsync(
      stateBuffer,
      0,
      bufferState_UpdateProvided
    );
    if (result.value === "not-equal") {
      processThenWait();
    } else {
      result.value.then(processThenWait);
    }
  }
};
