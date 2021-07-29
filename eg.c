
typedef struct adsf {
  float att_rate_db, decay_rate, release_rate, centible, egval;
  int sr;
  float* ob;
} adsr_t;
static float _output[16][128];
static adsr_t _k[16];
static unsigned char idx = 0;
#define silence 6.30957344480193e-8
#define log10silence -144
extern float fpower(int base, float exp);

static inline float cent2samples(int ct, int sr) {
  if (ct <= -12000) return 49.0f;
  return (fpower(2, ct / 1200.0f) * (float)sr);
}
adsr_t* init_eg(int attack, int decay, int sustain, int release, int sr) {
  adsr_t* env = &(_k[idx]);
  env->ob = _output + idx;
  env->sr = sr;
  env->att_rate_db = 960.0f / cent2samples(attack, sr);
  if (sustain == 0 || decay <= -12000) {
    env->decay_rate = 0.0f;
  } else {
    env->decay_rate = -1.0f * sustain / cent2samples(decay, sr);
  }
  env->centible = -960.0f;
  env->egval = 0.0000001f;
  return env;
}
void release(adsr_t* eg, int releaseCent) {
  eg->decay_rate = 0.0f;
  eg->att_rate_db = 0.0f;

  eg->release_rate = log10silence / cent2samples(releaseCent, eg->sr);
}
int processN(adsr_t* eg, int n) {
  // float* ob = _output[idx++];

  for (int i = 0; i < n; i++) {
    if (eg->centible < 0.0f && eg->att_rate_db > 0.0f) {
      eg->centible += eg->att_rate_db;
      eg->egval = fpower(10.0f, eg->centible / 200);
      if (eg->centible >= 0.0f) {
        eg->att_rate_db = 0;
      }
    } else if (eg->decay_rate != 0.0f) {
      eg->egval = (1 + eg->decay_rate) * eg->egval;
      if (eg->egval == 0.0f) eg->decay_rate = 0.0f;
    } else if (eg->release_rate != 0.f) {
      eg->egval += eg->release_rate * eg->egval;
    } else {
      eg->egval -= 0.0000001f * eg->egval;
    }
    eg->ob[i] = eg->egval;
  }

  return eg->ob;
}
int process(adsr_t* eg) { return processN(eg, 128); }
