import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.lifenexus.app",
  appName: "LifeNexus",
  webDir: "out",

  // HYBRID MODE: Connect to live dev server instead of bundled files
  // For production, change this to your deployed URL (e.g., https://lifenexus.vercel.app)
  server: {
    url: "http://localhost:3000",
    cleartext: true, // Required for http (not https)
  },

  // iOS-specific configuration
  ios: {
    contentInset: "automatic",
    allowsLinkPreview: false,
    scrollEnabled: true,
    backgroundColor: "#000000",
    preferredContentMode: "mobile",
  },

  // Plugin configurations
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#000000",
      showSpinner: false,
      spinnerColor: "#FFFFFF",
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#000000",
    },
    Keyboard: {
      resize: "native",
      resizeOnFullScreen: true,
    },
    Haptics: {
      selectionStartDuration: 10,
    },
  },
};

export default config;
