javascript ```
 import {EnvelopeGenerator} from "./index.js";
    test(() => {
      const instance = EnvelopeGenerator();
      assert_true(instance.exports.init_eg != null)

    }, "instantiates synchrounsly");
    test(() => {
      const instance = EnvelopeGenerator();
      for (let i = 0;i < 24;i++) {

        const re2f = instance.exports.init_eg(i * -100, 44, 120, 1100);
        const obj2 = instance.eg(re2f);
        //console.log(re2f, obj2)
      }

    }, "can retrieve eg attribute values");

    test(() => {
      const instance = EnvelopeGenerator();
      const re2f = instance.exports.init_eg(-4221, 44, 120, 1100);
      const obref = instance.exports.process(re2f);
      const ob = new Float32Array(instance.heap.buffer, obref, 128)
      assert_greater_than(ob[12], ob[1])

    }, "can run ");
    test(() => {
      const instance = EnvelopeGenerator();
      const re2f = instance.exports.init_eg(-1221, 290, 150, -12100);
      const obref = instance.exports.process(re2f);
      const ob = new Float32Array(instance.heap.buffer, obref, 128)
      assert_greater_than(ob[12], ob[1])
    }, "can run quickly");
    test(() => {
      const {mkEG} = EnvelopeGenerator();
      const eg = mkEG(-1222, 33, 156, 122);
      assert_less_than(eg.roll()[1], eg.roll()[1])
      assert_less_than(eg.roll()[1], eg.roll()[1])
      assert_less_than(eg.roll()[1], eg.roll()[1])
      eg.release();
      assert_greater_than(eg.roll()[1], eg.roll()[1])
      assert_greater_than(eg.roll()[1], eg.roll()[1])

    }, "trigger release");
		```