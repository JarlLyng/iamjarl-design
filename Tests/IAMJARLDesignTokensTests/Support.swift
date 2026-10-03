import SwiftUI
import XCTest
@testable import IAMJARLDesignTokens

// Resolve a colour the way SwiftUI would draw it in a given appearance, and
// compare it with the token it must match. Color.resolve(in:) is iOS 17 /
// macOS 14; on an older runtime the check is skipped, not passed.

private func resolved(_ color: Color, _ scheme: ColorScheme) -> [Float]? {
  guard #available(iOS 17, macOS 14, tvOS 17, watchOS 10, *) else { return nil }
  var env = EnvironmentValues()
  env.colorScheme = scheme
  let r = color.resolve(in: env)
  return [r.red, r.green, r.blue, r.opacity]
}

func assertAdaptive(
  _ adaptive: Color, light: Color, dark: Color, _ name: String,
  file: StaticString = #filePath, line: UInt = #line
) throws {
  guard let gotLight = resolved(adaptive, .light), let gotDark = resolved(adaptive, .dark),
        let wantLight = resolved(light, .light), let wantDark = resolved(dark, .dark) else {
    throw XCTSkip("Color.resolve(in:) needs iOS 17 / macOS 14")
  }
  #if os(watchOS)
  // watchOS has one appearance, dark.
  let expectedLight = wantDark
  #else
  let expectedLight = wantLight
  #endif
  for (got, want, mode) in [(gotLight, expectedLight, "light"), (gotDark, wantDark, "dark")] {
    let off = zip(got, want).map { abs($0 - $1) }.max() ?? 1
    XCTAssertLessThan(off, 0.002, "\(name) in \(mode): got \(got), want \(want)", file: file, line: line)
  }
}
