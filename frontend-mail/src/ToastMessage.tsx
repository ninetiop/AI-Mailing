import Toast from 'react-native-toast-message';

// Toast pour afficher un message de succès
export function showToastSuccess(message: string): void {
  Toast.show({
    type: 'success',
    text1: 'Success',
    text2: message,
    position: 'bottom',
    visibilityTime: 5000,
    autoHide: true,
    topOffset: 50,
  });
}

// Toast pour afficher un message d'erreur
export function showToastError(message: string): void {
  Toast.show({
    type: 'error',
    text1: 'Error',
    text2: message,
    position: 'bottom',
    visibilityTime: 5000,
    autoHide: true,
    topOffset: 50,
  });
}
