// IAMJARL Design Tokens v1.2.0 — generated, do not edit

export const meta = {"name":"IAMJARL Design System","version":"1.2.0"};

export const spacing = {"xs":4,"sm":8,"md":12,"lg":16,"xl":20,"xxl":24,"xxxl":32};

export const radius = {"sm":8,"md":12,"lg":16};

export const typography = {"family":{"ui":"system-ui","mono":"ui-monospace"},"weights":{"regular":400,"semibold":600,"bold":700},"sizes":{"xs":12,"sm":14,"base":16,"lg":18,"xl":24,"xxl":36},"lineHeights":{"xs":16,"sm":20,"base":24,"lg":28,"xl":32,"xxl":44}};

export const icons = {"library":"phosphor","defaultWeight":"regular","weightsAllowed":["thin","light","regular","bold","fill","duotone"],"defaultSizes":[16,20,24,28]};

export const colors = {"static":{"black":"#000000","white":"#FFFFFF"},"shared":{"success":"#4CAF50","onSuccess":"#000000","warning":"#FF6B35","onWarning":"#000000","error":"#D70015","onError":"#FFFFFF"},"light":{"primary":"#A435D2","onPrimary":"#FFFFFF","primaryHover":"#8E2BB8","primaryPressed":"#7A2499","primarySubtle":"rgba(164, 53, 210, 0.12)","text":{"primary":"#000000","secondary":"rgba(0, 0, 0, 0.70)","tertiary":"rgba(0, 0, 0, 0.55)","disabled":"rgba(0, 0, 0, 0.35)","inverse":"#FFFFFF"},"background":{"app":"#FFFFFF","muted":"rgba(0, 0, 0, 0.04)","card":"rgba(0, 0, 0, 0.04)","disabled":"rgba(0, 0, 0, 0.06)"},"surface":{"default":"#FFFFFF","raised":"rgba(0, 0, 0, 0.02)"},"border":{"subtle":"rgba(0, 0, 0, 0.10)","default":"rgba(0, 0, 0, 0.16)"},"state":{"success":"#2E7D32","warning":"#C2410C","error":"#D70015"}},"dark":{"primary":"#D0FF00","onPrimary":"#000000","primaryHover":"#B8E000","primaryPressed":"#A0C400","primarySubtle":"rgba(208, 255, 0, 0.15)","text":{"primary":"#FFFFFF","secondary":"rgba(255, 255, 255, 0.75)","tertiary":"rgba(255, 255, 255, 0.60)","disabled":"rgba(255, 255, 255, 0.35)","inverse":"#000000"},"background":{"app":"#000000","muted":"rgba(255, 255, 255, 0.05)","card":"rgba(255, 255, 255, 0.05)","disabled":"rgba(255, 255, 255, 0.07)"},"surface":{"default":"#000000","raised":"rgba(255, 255, 255, 0.03)"},"border":{"subtle":"rgba(255, 255, 255, 0.12)","default":"rgba(255, 255, 255, 0.18)"},"state":{"success":"#4CAF50","warning":"#FF6B35","error":"#FF453A"}}};

export function modeColors(mode) { return colors[mode]; }

export const shadows = {"sm":{"x":0,"y":1,"blur":2,"opacity":0.05},"md":{"x":0,"y":4,"blur":8,"opacity":0.08},"lg":{"x":0,"y":8,"blur":24,"opacity":0.12}};
export function shadowCss(name) {
  const s = shadows[name];
  return `${s.x}px ${s.y}px ${s.blur}px rgba(0, 0, 0, ${s.opacity})`;
}

export const motion = {"duration":{"fast":150,"normal":250,"slow":400},"easing":{"standard":[0.4,0,0.2,1],"emphasized":[0.2,0,0,1]}};
export function easingCss(name) {
  return `cubic-bezier(${motion.easing[name].join(", ")})`;
}

export const breakpoints = {"popup":320,"sm":640,"md":768,"lg":1024,"xl":1280,"xxl":1536};

export const focus = {"width":2,"offset":2};

export const zIndex = {"base":0,"dropdown":1000,"sticky":1100,"overlay":1200,"modal":1300,"popover":1400,"toast":1500,"tooltip":1600};

export const opacity = {"disabled":0.4,"muted":0.65};
