// IAMJARL Design Tokens v0.5.0 — generated, do not edit

export declare const meta: { readonly name: string; readonly version: string };

export declare const spacing: {"xs":4,"sm":8,"md":12,"lg":16,"xl":20,"xxl":24,"xxxl":32};
export declare const radius: {"sm":8,"md":12,"lg":16};
export declare const typography: {"family":{"ui":"system-ui","mono":"ui-monospace"},"weights":{"regular":400,"semibold":600,"bold":700},"sizes":{"xs":12,"sm":14,"base":16,"lg":18,"xl":24,"xxl":36},"lineHeights":{"tight":20,"normal":24,"relaxed":28,"xxl":43.2,"sm":18}};
export declare const icons: {"library":"phosphor","defaultWeight":"regular","weightsAllowed":["thin","light","regular","bold","fill","duotone"],"defaultSizes":[16,20,24,28]};
export declare const colors: {"static":{"black":"#000000","white":"#FFFFFF"},"shared":{"success":"#4CAF50","onSuccess":"#000000","warning":"#FF6B35","onWarning":"#000000","error":"#D70015","onError":"#FFFFFF"},"light":{"primary":"#A435D2","onPrimary":"#FFFFFF","text":{"primary":"#000000","secondary":"rgba(0, 0, 0, 0.70)","tertiary":"rgba(0, 0, 0, 0.55)","inverse":"#FFFFFF"},"background":{"app":"#FFFFFF","muted":"rgba(0, 0, 0, 0.04)","card":"rgba(0, 0, 0, 0.04)"},"surface":{"default":"#FFFFFF","raised":"rgba(0, 0, 0, 0.02)"},"border":{"subtle":"rgba(0, 0, 0, 0.10)","default":"rgba(0, 0, 0, 0.16)"}},"dark":{"primary":"#D0FF00","onPrimary":"#000000","text":{"primary":"#FFFFFF","secondary":"rgba(255, 255, 255, 0.75)","tertiary":"rgba(255, 255, 255, 0.60)","inverse":"#000000"},"background":{"app":"#000000","muted":"rgba(255, 255, 255, 0.05)","card":"rgba(255, 255, 255, 0.05)"},"surface":{"default":"#000000","raised":"rgba(255, 255, 255, 0.03)"},"border":{"subtle":"rgba(255, 255, 255, 0.12)","default":"rgba(255, 255, 255, 0.18)"}}};

export type ColorMode = "light" | "dark";
export declare function modeColors(mode: ColorMode): typeof colors.light;

export declare const shadows: {"sm":{"x":0,"y":1,"blur":2,"opacity":0.05},"md":{"x":0,"y":4,"blur":8,"opacity":0.08},"lg":{"x":0,"y":8,"blur":24,"opacity":0.12}};
export declare function shadowCss(name: keyof typeof shadows): string;
export declare const motion: {"duration":{"fast":150,"normal":250,"slow":400},"easing":{"standard":[0.4,0,0.2,1],"emphasized":[0.2,0,0,1]}};
export declare function easingCss(name: keyof typeof motion.easing): string;
export declare const breakpoints: {"popup":320,"sm":640,"md":768,"lg":1024,"xl":1280,"xxl":1536};
export declare const focus: {"width":2,"offset":2};

export type Spacing = typeof spacing;
export type SpacingKey = keyof Spacing;
export type Radius = typeof radius;
export type RadiusKey = keyof Radius;
export type Typography = typeof typography;
export type FontSize = keyof Typography["sizes"];
export type FontWeight = keyof Typography["weights"];
export type LineHeight = keyof Typography["lineHeights"];
export type ThemeColors = typeof colors.light;
export type StaticColors = typeof colors.static;
export type SharedColors = typeof colors.shared;
export type Shadows = typeof shadows;
export type ShadowKey = keyof Shadows;
export type Motion = typeof motion;
export type DurationKey = keyof Motion["duration"];
export type EasingKey = keyof Motion["easing"];
export type Breakpoints = typeof breakpoints;
export type BreakpointKey = keyof Breakpoints;
export type Focus = typeof focus;
