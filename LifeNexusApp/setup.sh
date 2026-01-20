#!/bin/bash

# LifeNexus iOS - Xcode Setup Script
# Bu script Xcode projesini oluşturur ve yapılandırır

set -e

echo "🚀 LifeNexus iOS Setup"
echo "======================"

# Check Xcode installation
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Xcode kurulu değil!"
    echo "   App Store'dan Xcode'u indirin: https://apps.apple.com/app/xcode/id497799835"
    exit 1
fi

XCODE_VERSION=$(xcodebuild -version | head -1)
echo "✅ $XCODE_VERSION"

# Navigate to project directory
cd "$(dirname "$0")"
echo "📁 Dizin: $(pwd)"

# Install XcodeGen if not present
if ! command -v xcodegen &> /dev/null; then
    echo "📦 XcodeGen kuruluyor..."
    brew install xcodegen || {
        echo "❌ XcodeGen kurulamadı. Manuel kurulum için:"
        echo "   brew install xcodegen"
        exit 1
    }
fi

# Generate Xcode project
echo "🔧 Xcode projesi oluşturuluyor..."
xcodegen generate

# Install Swift packages
echo "📦 Swift paketleri yükleniyor..."
xcodebuild -resolvePackageDependencies -project LifeNexus.xcodeproj -scheme LifeNexus

echo ""
echo "✅ Kurulum tamamlandı!"
echo ""
echo "📱 Projeyi açmak için:"
echo "   open LifeNexus.xcodeproj"
echo ""
echo "🎯 Sonraki adımlar:"
echo "   1. Xcode'da hedef cihazı seçin (iPhone 15 Pro)"
echo "   2. ⌘R ile uygulamayı çalıştırın"
