import SwiftUI
#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

// The colours in DesignTokens.Palette are built here. Hand-written because it is
// platform code, not token data: the palette itself is generated from
// tokens.json and calls this once per colour.

public extension DesignTokens {
  /// A colour that resolves to `light` or `dark` by itself, from the appearance
  /// of wherever it is drawn. Nothing to pass, so it works in a `ShapeStyle`, a
  /// widget, a `.tint()` or a UIKit/AppKit view as well as in a SwiftUI body.
  ///
  /// Use it for an app's own derived colours, so they adapt the way the
  /// palette does:
  ///
  ///     static let ringTrack = DesignTokens.adaptive(
  ///       light: .black.opacity(0.08), dark: .white.opacity(0.12))
  ///
  /// watchOS has one appearance, dark, so there this is always `dark`.
  static func adaptive(light: Color, dark: Color) -> Color {
    #if os(watchOS)
    return dark
    #elseif canImport(UIKit)
    let l = UIColor(light), d = UIColor(dark)
    return Color(uiColor: UIColor { $0.userInterfaceStyle == .dark ? d : l })
    #elseif canImport(AppKit)
    let l = NSColor(light), d = NSColor(dark)
    let ns = NSColor(name: nil) { appearance in
      appearance.bestMatch(from: [.aqua, .darkAqua]) == .darkAqua ? d : l
    }
    if #available(macOS 12, *) { return Color(nsColor: ns) }
    return Color(ns)
    #else
    return light
    #endif
  }
}
