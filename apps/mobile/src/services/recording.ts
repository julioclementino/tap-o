import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
/** Delete only this recorder's cache file, never bundled demo assets or arbitrary paths. */
export function discardRecording(uri: string | null) {
  if (!uri) return;
  if (Platform.OS === 'web') {
    if (uri.startsWith('blob:')) URL.revokeObjectURL(uri);
    return;
  }
  if (!uri.startsWith(Paths.cache.uri)) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    /* The OS also reclaims cache files; never upload them. */
  }
}
