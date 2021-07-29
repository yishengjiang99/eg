import { wasmbin } from "./eg.wasm.js";

export class EGNode extends AudioWorkletNode {
  static async init(ctx) {
    await ctx.audioWorklet.addModule("./eg-proc.js");
  }
  constructor(ctx, [a, d, s, r], onoff) {
    super(ctx, "eg-proc", {
      numberOfInputs: [2],
      numberOfOutputs: [1],
      processorOptions: { wasm: wasmbin, env: [a, d, s, r] },
    });
    this.onoff = onoff || new ConstantSourceNode(ctx, { offset: 2 });
    this.onoff.connect(this, 0, 1);
  }
  trigger(time = 0) {
    this.onoff.offset.setValueAtTime(2, time);
  }
  release(time = 0) {
    this.onoff.offset.setValueAtTime(1, time);
  }
  off(time = 0) {
    this.onoff.offset.setValueAtTime(0, time);
  }
}
