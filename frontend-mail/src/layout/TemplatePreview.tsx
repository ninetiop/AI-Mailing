import React from "react";
import { Modal, View, Text } from "react-native";
import { WebView } from "react-native-webview";
import { Platform } from "react-native";

interface TemplatePreviewProps {
  templateHtml: string;
  isOpen: boolean;
  onClose: () => void;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ templateHtml, isOpen, onClose }) => {
  return (
    <Modal visible={isOpen} animationType="slide" transparent={true}>
      <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "center" }}>
        <View style={{ backgroundColor: "white", padding: 20, borderRadius: 10, margin: 20 }}>
          <Text onPress={onClose} style={{ textAlign: "right", color: "red", fontSize: 18 }}>✖</Text>

          {Platform.OS === "web" ? (
            // Pour le Web, on utilise un iFrame
            <iframe
              srcDoc={templateHtml}
              style={{ width: "100%", height: 400, borderRadius: 10, border: "1px solid #ddd" }}
            />
          ) : (
            // Pour iOS et Android, on utilise WebView
            <WebView
              originWhitelist={["*"]}
              source={{ html: templateHtml }}
              style={{ height: 400 }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

export default TemplatePreview;