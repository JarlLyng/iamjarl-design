import SwiftUI

// MARK: - IAMJARL Design Tokens (SwiftUI)
//
// Auto-generated from tokens.json v0.5.0 — do not edit manually.
// Run: node scripts/build.js
//
// Design DNA:
// - Neon primary (light: #A435D2, dark: #D0FF00)
// - Subtle translucent surfaces
// - Consistent state colors (success/warning/error)

public enum DesignTokens {

  // MARK: Spacing
  public enum Spacing {
    public static let xs: CGFloat = 4
    public static let sm: CGFloat = 8
    public static let md: CGFloat = 12
    public static let lg: CGFloat = 16
    public static let xl: CGFloat = 20
    public static let xxl: CGFloat = 24
    public static let xxxl: CGFloat = 32
  }

  // MARK: Radius
  public enum Radius {
    public static let sm: CGFloat = 8
    public static let md: CGFloat = 12
    public static let lg: CGFloat = 16
  }

  // MARK: Typography
  // Note: SwiftUI does not use numeric weights directly; these are mapped to Font.Weight.
  public enum Typography {
    public static let uiFontName: String = "system-ui"
    public static let monoFontName: String = "ui-monospace"

    public enum Size {
      public static let xs: CGFloat = 12
      public static let sm: CGFloat = 14
      public static let base: CGFloat = 16
      public static let lg: CGFloat = 18
      public static let xl: CGFloat = 24
      public static let xxl: CGFloat = 36
    }

    public enum LineHeight {
      public static let tight: CGFloat = 20
      public static let normal: CGFloat = 24
      public static let relaxed: CGFloat = 28
      public static let xxl: CGFloat = 43.2
      public static let sm: CGFloat = 18
    }

    public enum Weight {
      public static let regular: Font.Weight = .regular
      public static let semibold: Font.Weight = .semibold
      public static let bold: Font.Weight = .bold
    }
  }

  // MARK: Shadow
  public enum Shadow {
    public struct Value {
      public let x: CGFloat
      public let y: CGFloat
      public let blur: CGFloat
      public let opacity: Double
    }
    public static let sm = Value(x: 0, y: 1, blur: 2, opacity: 0.05)
    public static let md = Value(x: 0, y: 4, blur: 8, opacity: 0.08)
    public static let lg = Value(x: 0, y: 8, blur: 24, opacity: 0.12)
  }

  // MARK: Motion
  public enum Motion {
    public enum Duration {
      public static let fast: Double = 0.15
      public static let normal: Double = 0.25
      public static let slow: Double = 0.4
    }

    public enum Easing {
      public static func standard(duration: Double = Duration.normal) -> Animation {
        Animation.timingCurve(0.4, 0, 0.2, 1, duration: duration)
      }
      public static func emphasized(duration: Double = Duration.normal) -> Animation {
        Animation.timingCurve(0.2, 0, 0, 1, duration: duration)
      }
    }
  }

  // MARK: Breakpoints
  public enum Breakpoint {
    public static let popup: CGFloat = 320
    public static let sm: CGFloat = 640
    public static let md: CGFloat = 768
    public static let lg: CGFloat = 1024
    public static let xl: CGFloat = 1280
    public static let xxl: CGFloat = 1536
  }

  // MARK: Focus
  public enum Focus {
    public static let width: CGFloat = 2
    public static let offset: CGFloat = 2
  }

  // MARK: Color Tokens
  public enum ColorToken {

    // Static
    public static let black = Color(hex: "#000000")
    public static let white = Color(hex: "#FFFFFF")

    // Shared state colors
    public enum State {
      public static let success = Color(hex: "#4CAF50")
      public static let onSuccess = Color(hex: "#000000")

      public static let warning = Color(hex: "#FF6B35")
      public static let onWarning = Color(hex: "#000000")

      public static let error = Color(hex: "#D70015")
      public static let onError = Color(hex: "#FFFFFF")
    }

    // Mode-aware colors (Light)
    public enum Light {
      public static let primary = Color(hex: "#A435D2")
      public static let onPrimary = Color(hex: "#FFFFFF")

      public enum Text {
        public static let primary = Color(hex: "#000000")
        public static let secondary = Color(rgba: "rgba(0, 0, 0, 0.70)")
        public static let tertiary = Color(rgba: "rgba(0, 0, 0, 0.55)")
        public static let inverse = Color(hex: "#FFFFFF")
      }

      public enum Background {
        public static let app = Color(hex: "#FFFFFF")
        public static let muted = Color(rgba: "rgba(0, 0, 0, 0.04)")
        public static let card = Color(rgba: "rgba(0, 0, 0, 0.04)")
      }

      public enum Surface {
        public static let `default` = Color(hex: "#FFFFFF")
        public static let raised = Color(rgba: "rgba(0, 0, 0, 0.02)")
      }

      public enum Border {
        public static let subtle = Color(rgba: "rgba(0, 0, 0, 0.10)")
        public static let `default` = Color(rgba: "rgba(0, 0, 0, 0.16)")
      }
    }

    // Mode-aware colors (Dark)
    public enum Dark {
      public static let primary = Color(hex: "#D0FF00")
      public static let onPrimary = Color(hex: "#000000")

      public enum Text {
        public static let primary = Color(hex: "#FFFFFF")
        public static let secondary = Color(rgba: "rgba(255, 255, 255, 0.75)")
        public static let tertiary = Color(rgba: "rgba(255, 255, 255, 0.60)")
        public static let inverse = Color(hex: "#000000")
      }

      public enum Background {
        public static let app = Color(hex: "#000000")
        public static let muted = Color(rgba: "rgba(255, 255, 255, 0.05)")
        public static let card = Color(rgba: "rgba(255, 255, 255, 0.05)")
      }

      public enum Surface {
        public static let `default` = Color(hex: "#000000")
        public static let raised = Color(rgba: "rgba(255, 255, 255, 0.03)")
      }

      public enum Border {
        public static let subtle = Color(rgba: "rgba(255, 255, 255, 0.12)")
        public static let `default` = Color(rgba: "rgba(255, 255, 255, 0.18)")
      }
    }
  }

  // MARK: - Mode Helpers

  /// Pick a value by ColorScheme.
  public static func pick<T>(_ light: T, _ dark: T, scheme: ColorScheme) -> T {
    scheme == .dark ? dark : light
  }

  /// Pick a Color by ColorScheme.
  public static func color(light: Color, dark: Color, scheme: ColorScheme) -> Color {
    pick(light, dark, scheme: scheme)
  }

  /// Convenient accessors for common colors without nesting.
  public enum Common {
    public enum OnPrimary {
      public static func text(_ scheme: ColorScheme) -> Color {
        DesignTokens.color(
          light: ColorToken.Light.onPrimary,
          dark: ColorToken.Dark.onPrimary,
          scheme: scheme
        )
      }
    }
    public static func primary(_ scheme: ColorScheme) -> Color {
      DesignTokens.color(light: ColorToken.Light.primary, dark: ColorToken.Dark.primary, scheme: scheme)
    }

    public enum Text {
      public static func primary(_ scheme: ColorScheme) -> Color {
        DesignTokens.color(light: ColorToken.Light.Text.primary, dark: ColorToken.Dark.Text.primary, scheme: scheme)
      }
      public static func secondary(_ scheme: ColorScheme) -> Color {
        DesignTokens.color(light: ColorToken.Light.Text.secondary, dark: ColorToken.Dark.Text.secondary, scheme: scheme)
      }
      public static func tertiary(_ scheme: ColorScheme) -> Color {
        DesignTokens.color(light: ColorToken.Light.Text.tertiary, dark: ColorToken.Dark.Text.tertiary, scheme: scheme)
      }
      public static func inverse(_ scheme: ColorScheme) -> Color {
        DesignTokens.color(light: ColorToken.Light.Text.inverse, dark: ColorToken.Dark.Text.inverse, scheme: scheme)
      }
    }

    public enum Background {
      public static func app(_ scheme: ColorScheme) -> Color {
        DesignTokens.color(light: ColorToken.Light.Background.app, dark: ColorToken.Dark.Background.app, scheme: scheme)
      }
      public static func muted(_ scheme: ColorScheme) -> Color {
        DesignTokens.color(light: ColorToken.Light.Background.muted, dark: ColorToken.Dark.Background.muted, scheme: scheme)
      }
      public static func card(_ scheme: ColorScheme) -> Color {
        DesignTokens.color(light: ColorToken.Light.Background.card, dark: ColorToken.Dark.Background.card, scheme: scheme)
      }
    }

    public enum Border {
      public static func subtle(_ scheme: ColorScheme) -> Color {
        DesignTokens.color(light: ColorToken.Light.Border.subtle, dark: ColorToken.Dark.Border.subtle, scheme: scheme)
      }
      public static func `default`(_ scheme: ColorScheme) -> Color {
        DesignTokens.color(light: ColorToken.Light.Border.default, dark: ColorToken.Dark.Border.default, scheme: scheme)
      }
    }
  }
}

// MARK: - Color Parsing Helpers

public extension Color {
  /// Initialize a Color from hex strings like "#RRGGBB" or "#AARRGGBB".
  init(hex: String) {
    let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
    var int: UInt64 = 0
    Scanner(string: hex).scanHexInt64(&int)

    let a, r, g, b: UInt64
    switch hex.count {
    case 6:
      (a, r, g, b) = (255, (int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
    case 8:
      (a, r, g, b) = ((int >> 24) & 0xFF, (int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
    default:
      (a, r, g, b) = (255, 0, 0, 0)
    }

    self.init(
      .sRGB,
      red: Double(r) / 255.0,
      green: Double(g) / 255.0,
      blue: Double(b) / 255.0,
      opacity: Double(a) / 255.0
    )
  }

  /// Initialize a Color from a CSS-like rgba() string: "rgba(r, g, b, a)".
  init(rgba: String) {
    let cleaned = rgba
      .replacingOccurrences(of: "rgba(", with: "")
      .replacingOccurrences(of: ")", with: "")
      .replacingOccurrences(of: " ", with: "")

    let parts = cleaned.split(separator: ",").map(String.init)
    guard parts.count == 4,
          let r = Double(parts[0]),
          let g = Double(parts[1]),
          let b = Double(parts[2]),
          let a = Double(parts[3]) else {
      self = .clear
      return
    }

    self.init(.sRGB, red: r / 255.0, green: g / 255.0, blue: b / 255.0, opacity: a)
  }
}
