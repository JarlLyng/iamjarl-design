import SwiftUI
import XCTest
@testable import IAMJARLDesignTokens

// Renders real text and measures it, so these test what a person sees: that a
// token is exact at the default text size, grows when they ask for larger text,
// and that a numeral's digits do not shift as they change.

@MainActor
private func rendered<V: View>(_ view: V, _ size: DynamicTypeSize = .large) -> CGSize? {
  guard #available(iOS 16, macOS 13, tvOS 16, watchOS 9, *) else { return nil }
  let renderer = ImageRenderer(content: view.environment(\.dynamicTypeSize, size).fixedSize())
  renderer.scale = 1
  guard let image = renderer.cgImage else { return nil }
  return CGSize(width: image.width, height: image.height)
}

@MainActor
final class TypographyTests: XCTestCase {
  func testNumeralDigitsAreTabular() throws {
    guard let ones = rendered(Text("1111").ijNumeral(.md)),
          let zeros = rendered(Text("0000").ijNumeral(.md)) else { throw XCTSkip("ImageRenderer unavailable") }
    XCTAssertEqual(ones.width, zeros.width, accuracy: 1, "a timer must not shift sideways as its digits change")
  }

  func testEveryStyleAndNumeralIsAboveZero() {
    XCTAssertTrue(DesignTokens.Typography.Style.allCases.allSatisfy { $0.size > 0 && $0.lineHeight >= $0.size })
    XCTAssertEqual(DesignTokens.Typography.Numeral.allCases.map(\.size),
                   DesignTokens.Typography.Numeral.allCases.map(\.size).sorted())
  }

  #if os(iOS)
  // Dynamic Type is an iOS (and watchOS) setting; macOS and tvOS draw at one size.

  func testATokenIsExactAtTheDefaultTextSize() throws {
    for style in DesignTokens.Typography.Style.allCases {
      guard let scaled = rendered(Text("Hg").ijFont(style)),
            let fixed = rendered(Text("Hg").font(.system(size: style.size))) else { throw XCTSkip("ImageRenderer unavailable") }
      XCTAssertEqual(scaled.height, fixed.height, accuracy: 1, "\(style) should be \(style.size) pt at the default size")
    }
  }

  func testTextGrowsWithDynamicType() throws {
    for style in DesignTokens.Typography.Style.allCases {
      guard let normal = rendered(Text("Hg").ijFont(style)),
            let large = rendered(Text("Hg").ijFont(style), .accessibility3) else { throw XCTSkip("ImageRenderer unavailable") }
      XCTAssertGreaterThan(large.height, normal.height * 1.2, "\(style) did not grow for a person who asked for larger text")
    }
  }

  func testANumeralGrowsButStopsBeforeLeavingTheScreen() throws {
    let lg = DesignTokens.Typography.Numeral.lg
    let cap = DesignTokens.Typography.numeralMaxScale
    guard let normal = rendered(Text("00:00").ijNumeral(.lg)),
          let largest = rendered(Text("00:00").ijNumeral(.lg), .accessibility5),
          let ceiling = rendered(Text("00:00").font(.system(size: lg.size * cap, weight: .bold).monospacedDigit())) else {
      throw XCTSkip("ImageRenderer unavailable")
    }
    XCTAssertGreaterThan(largest.height, normal.height, "a numeral should still respond to Dynamic Type")
    XCTAssertLessThanOrEqual(largest.width, ceiling.width + 1, "a numeral grew past \(cap)× its size")
  }
  #endif
}
