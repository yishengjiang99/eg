
typedef struct adsf {
  float att_rate_db, decay_rate, release_rate, centible, egval;
} adsr_t;
#define sr 48000.0f
static float _output[16][128];
static adsr_t _k[255];
static unsigned char idx = 0;
#define silence 6.30957344480193e-8
#define log10silence -144
extern float fpower(int base, float exp);
static inline float cent2samples(int ct) {
  if (ct <= -12000) return 49.0f;
  return (fpower(2, ct / 1200.0f) * sr);
}
adsr_t* init_eg(int attack, int decay, int sustain, int release) {
  adsr_t* env = &(_k[++idx]);

  env->att_rate_db = 960.0f / cent2samples(attack);
  if (sustain == 0 || decay <= -12000) {
    env->decay_rate = 0.0f;
  } else {
    env->decay_rate = -1.0f * sustain / cent2samples(decay);
  }
  env->centible = -960.0f;
  env->egval = 0.00001f;
  return env;
}
void release(adsr_t* eg, int releaseCent) {
  eg->decay_rate = 0.0f;
  eg->att_rate_db = 0.0f;

  eg->release_rate = log10silence / cent2samples(releaseCent);
}

int process(adsr_t* eg) {
  float* ob = _output[idx & 0x0f];
  int n = 128;
  int att_ends_this_cycle = 0;
  if (eg->att_rate_db != 0 && eg->centible + eg->att_rate_db * n >= 0.0f) {
    att_ends_this_cycle = 1;
  }
  for (int i = 0; i < 128; i++) {
    if (att_ends_this_cycle) {
      eg->centible += eg->att_rate_db;
      eg->egval = fpower(10.0f, eg->centible * 0.005);
      if (eg->centible >= 0.0f) {
        eg->att_rate_db = 0.0f;
        eg->centible = 0.0f;
        eg->egval = 1.0f;
        att_ends_this_cycle = 0;
      }

    } else if (eg->att_rate_db > 0.000001f) {
      eg->centible += eg->att_rate_db;
      eg->egval = fpower(10.0f, eg->centible * 0.005);
    } else if (eg->decay_rate != 0.0f) {
      eg->egval += eg->decay_rate * eg->egval;
      if (eg->egval == 0.0f) eg->decay_rate = 0.0f;
    } else if (eg->release_rate != 0.f) {
      eg->egval += eg->release_rate * eg->egval;
    } else {
      // eg->egval -= 0.0000001f * eg->egval;
    }
    ob[i] = eg->egval;
  }
  return ob;
}
