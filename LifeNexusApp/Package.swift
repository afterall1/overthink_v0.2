// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "LifeNexus",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(
            name: "LifeNexus",
            targets: ["LifeNexus"]
        ),
    ],
    dependencies: [
        // Supabase Swift SDK
        .package(url: "https://github.com/supabase/supabase-swift", from: "2.0.0"),
        
        // Firebase for AI (Gemini)
        .package(url: "https://github.com/firebase/firebase-ios-sdk", from: "11.0.0"),
        
        // Lottie for animations
        .package(url: "https://github.com/airbnb/lottie-spm", from: "4.0.0"),
    ],
    targets: [
        .target(
            name: "LifeNexus",
            dependencies: [
                .product(name: "Supabase", package: "supabase-swift"),
                .product(name: "FirebaseAI", package: "firebase-ios-sdk"),
                .product(name: "Lottie", package: "lottie-spm"),
            ]
        ),
        .testTarget(
            name: "LifeNexusTests",
            dependencies: ["LifeNexus"]
        ),
    ]
)
