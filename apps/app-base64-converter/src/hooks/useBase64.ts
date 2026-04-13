import { useState, useCallback } from 'react';
import { Base64 } from 'js-base64';

interface JwtInfo {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  formatted: string;
}

interface UseBase64Return {
  input: string;
  setInput: (v: string) => void;
  output: string;
  realtimeEnabled: boolean;
  setRealtimeEnabled: (v: boolean) => void;
  urlSafe: boolean;
  setUrlSafe: (v: boolean) => void;
  jwtInfo: JwtInfo | null;
  encode: (text?: string) => void;
  decode: () => void;
  showJwtPayload: () => void;
  copyOutput: () => Promise<boolean>;
  // Image mode
  imageData: string | null;
  handleImageFile: (file: File) => void;
  getImageCopyText: (format: 'raw' | 'html' | 'css') => string;
}

export function useBase64(): UseBase64Return {
  const [input, setInputState] = useState('');
  const [output, setOutput] = useState('');
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [urlSafe, setUrlSafe] = useState(false);
  const [jwtInfo, setJwtInfo] = useState<JwtInfo | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);

  const checkJWT = useCallback((base64String: string) => {
    if (base64String.startsWith('ey')) {
      try {
        const parts = base64String.split('.');
        if (parts.length === 3) {
          const header = JSON.parse(Base64.decode(parts[0])) as Record<string, unknown>;
          const payload = JSON.parse(Base64.decode(parts[1])) as Record<string, unknown>;
          const formatted = `JWT Header:\n${JSON.stringify(header, null, 2)}\n\nJWT Payload:\n${JSON.stringify(payload, null, 2)}`;
          setJwtInfo({ header, payload, formatted });
          return;
        }
      } catch (_e) { /* not JWT */ }
    }
    setJwtInfo(null);
  }, []);

  const encode = useCallback((text?: string) => {
    const val = text ?? input;
    if (!val) {
      setOutput('');
      setJwtInfo(null);
      return;
    }
    try {
      let encoded = Base64.encode(val);
      if (urlSafe) {
        encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      }
      setOutput(encoded);
      checkJWT(encoded);
    } catch (e) {
      const err = e as Error;
      setOutput('인코딩 오류: ' + err.message);
    }
  }, [input, urlSafe, checkJWT]);

  const decode = useCallback(() => {
    if (!input) {
      setOutput('');
      setJwtInfo(null);
      return;
    }
    try {
      let toDecode = input.trim();
      if (urlSafe || toDecode.includes('-') || toDecode.includes('_')) {
        toDecode = toDecode.replace(/-/g, '+').replace(/_/g, '/');
        while (toDecode.length % 4) {
          toDecode += '=';
        }
      }
      const decoded = Base64.decode(toDecode);
      setOutput(decoded);
      checkJWT(toDecode);
    } catch (e) {
      const err = e as Error;
      setOutput('유효하지 않은 Base64 형식입니다: ' + err.message);
    }
  }, [input, urlSafe, checkJWT]);

  const showJwtPayload = useCallback(() => {
    if (jwtInfo) {
      setOutput(jwtInfo.formatted);
    }
  }, [jwtInfo]);

  const setInput = useCallback((v: string) => {
    setInputState(v);
    if (realtimeEnabled && v) {
      try {
        let encoded = Base64.encode(v);
        if (urlSafe) {
          encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        }
        setOutput(encoded);
        checkJWT(encoded);
      } catch (_e) { /* skip */ }
    } else if (!v) {
      setOutput('');
      setJwtInfo(null);
    }
  }, [realtimeEnabled, urlSafe, checkJWT]);

  const copyOutput = useCallback(async (): Promise<boolean> => {
    if (!output) return false;
    try {
      await navigator.clipboard.writeText(output);
      return true;
    } catch (_e) {
      return false;
    }
  }, [output]);

  const handleImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageData(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const getImageCopyText = useCallback((format: 'raw' | 'html' | 'css'): string => {
    if (!imageData) return '';
    switch (format) {
      case 'raw': return imageData;
      case 'html': return `<img src="${imageData}" alt="Image">`;
      case 'css': return `background-image: url('${imageData}');`;
    }
  }, [imageData]);

  return {
    input, setInput, output,
    realtimeEnabled, setRealtimeEnabled,
    urlSafe, setUrlSafe,
    jwtInfo,
    encode, decode, showJwtPayload, copyOutput,
    imageData, handleImageFile, getImageCopyText,
  };
}
