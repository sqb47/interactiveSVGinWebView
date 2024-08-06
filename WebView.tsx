import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import WebView from "react-native-webview";
import { htmlString } from "./htmlCode";

export type webViewMapRef = {
  resetZoom: (country: string) => void;
};

const MapWebView = forwardRef(({}, ref) => {
  const webviewRef = useRef<any>(null);

  const onMessage = (event: any) => {
    // Handle the message received from the web page
    const message = JSON.parse(event.nativeEvent.data);
    console.log("message::", message);
  };

  const resetZoom = () => {
    // JavaScript code to run in WebView
    const jsCode = `
        (function() {
          resetZoomAndPan();
        })();
        true;
      `;
    webviewRef.current.injectJavaScript(jsCode);
  };

  useImperativeHandle(ref, () => ({
    resetZoom,
  }));

  const WebViewMap = useMemo(
    () => (
      <WebView
        source={{ html: htmlString("") }}
        style={{ flex: 1 }}
        ref={webviewRef}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        onMessage={onMessage}
        androidLayerType={"hardware"}
        injectedJavaScript={`
            window.ReactNativeWebView = window.ReactNativeWebView || {};
            window.ReactNativeWebView.postMessage = window.ReactNativeWebView.postMessage || function(data) {
              window.postMessage(data, '*');
            };
            true; // note: this is required, or you'll sometimes get silent failures
          `}
      />
    ),
    []
  );

  return <View style={{ flex: 1 }}>{WebViewMap}</View>;
});

export default MapWebView;
