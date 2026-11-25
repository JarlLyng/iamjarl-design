// Compiles dist/kotlin/DesignTokens.kt as an Android library and runs its tests
// (#128), so CI fails when the Kotlin output drifts from tokens.json or stops
// compiling. Nothing here ships: an app copies the one generated file instead.
//
//   gradle -p android :tokens:testDebugUnitTest     (Gradle 9.4.1, JDK 17 or later)

pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "iamjarl-design-android"
include(":tokens")
