import SwiftUI
#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

// Type that follows Dynamic Type. The sizes are tokens; how they scale is
// platform code, so it lives here and reads DesignTokens.Typography.Style and
// .Numeral, which are generated from tokens.json.
//
// A fixed `.font(.system(size: DesignTokens.Typography.Size.base))` stays 16 pt
// for someone who has asked their phone for larger text. These do not.

public extension View {
  /// A size from the text scale, scaled with Dynamic Type along the Apple text
  /// style nearest to it, with the token's line height.
  ///
  ///     Text("Rounds").ijFont(.lg, weight: .semibold)
  func ijFont(
    _ style: DesignTokens.Typography.Style,
    weight: Font.Weight = .regular,
    design: Font.Design = .default
  ) -> some View {
    modifier(IJScaledFont(style: style, weight: weight, design: design))
  }

  /// A number that is the interface (a timer, a counter, a readout), with
  /// tabular digits, so it does not shift sideways as the digits change.
  ///
  ///     Text(timeString).ijNumeral(.lg)
  ///
  /// It scales with Dynamic Type, but no further than
  /// `DesignTokens.Typography.numeralMaxScale` times its size: an 80 pt timer
  /// that keeps growing leaves the screen.
  func ijNumeral(
    _ numeral: DesignTokens.Typography.Numeral,
    weight: Font.Weight = .bold,
    design: Font.Design = .default
  ) -> some View {
    modifier(IJNumeral(numeral: numeral, weight: weight, design: design))
  }
}

public extension DesignTokens.Typography {
  /// How far a numeral may grow under Dynamic Type, as a multiple of its size.
  static let numeralMaxScale: CGFloat = 1.5
}

struct IJScaledFont: ViewModifier {
  @ScaledMetric private var size: CGFloat
  @ScaledMetric private var lineHeight: CGFloat
  let weight: Font.Weight
  let design: Font.Design

  init(style: DesignTokens.Typography.Style, weight: Font.Weight, design: Font.Design) {
    _size = ScaledMetric(wrappedValue: style.size, relativeTo: style.textStyle)
    _lineHeight = ScaledMetric(wrappedValue: style.lineHeight, relativeTo: style.textStyle)
    self.weight = weight
    self.design = design
  }

  func body(content: Content) -> some View {
    content
      .font(.system(size: size, weight: weight, design: design))
      // lineSpacing is added to the font's own line height, not a total, so
      // the token's line height is reached by adding only the difference.
      .lineSpacing(max(0, lineHeight - naturalLineHeight(size)))
  }
}

struct IJNumeral: ViewModifier {
  @ScaledMetric private var scaled: CGFloat
  let base: CGFloat
  let weight: Font.Weight
  let design: Font.Design

  init(numeral: DesignTokens.Typography.Numeral, weight: Font.Weight, design: Font.Design) {
    _scaled = ScaledMetric(wrappedValue: numeral.size, relativeTo: .largeTitle)
    base = numeral.size
    self.weight = weight
    self.design = design
  }

  func body(content: Content) -> some View {
    let size = min(scaled, base * DesignTokens.Typography.numeralMaxScale)
    return content.font(.system(size: size, weight: weight, design: design).monospacedDigit())
  }
}

/// The height the system font sets a line at, before any extra spacing.
func naturalLineHeight(_ size: CGFloat) -> CGFloat {
  #if canImport(UIKit)
  return UIFont.systemFont(ofSize: size).lineHeight
  #elseif canImport(AppKit)
  let f = NSFont.systemFont(ofSize: size)
  return f.ascender - f.descender + f.leading
  #else
  return size * 1.2
  #endif
}
