plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.iamjarl.design"
    compileSdk = 36

    defaultConfig {
        minSdk = 24
    }

    buildFeatures {
        compose = true
    }

    // The file an app copies, compiled where it is generated.
    sourceSets {
        getByName("main") {
            kotlin.directories.add("../../dist/kotlin")
        }
    }

    testOptions {
        // Material 3's type scale is built in a plain JVM test, where the Android
        // framework is a stub.
        unitTests.isReturnDefaultValues = true
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2026.05.01")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")

    testImplementation("junit:junit:4.13.2")
}
