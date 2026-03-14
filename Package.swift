// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "IAMJARLDesignTokens",
    platforms: [.iOS(.v16), .macOS(.v13), .watchOS(.v9), .tvOS(.v16)],
    products: [
        .library(name: "IAMJARLDesignTokens", targets: ["IAMJARLDesignTokens"])
    ],
    targets: [
        .target(name: "IAMJARLDesignTokens", path: "Sources/IAMJARLDesignTokens")
    ]
)
