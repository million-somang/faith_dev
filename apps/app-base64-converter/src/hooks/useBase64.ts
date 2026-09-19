import { useState, useCallback } from 'react';
import { Base64 } from 'js-base64';
import { sound } from '../utils/sound';

export interface JwtInfo {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  formatted: string;
}

export interface UseBase64Return {
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
  clearAll: () => void;
  loadSampleText: (type: 'korean' | 'jwt' | 'json') => void;
  // Image mode
  imageData: string | null;
  imageFileName: string;
  handleImageFile: (file: File) => void;
  getImageCopyText: (format: 'raw' | 'html' | 'css') => string;
  loadSampleImage: () => void;
  clearImage: () => void;
}

export function useBase64(): UseBase64Return {
  const [input, setInputState] = useState('');
  const [output, setOutput] = useState('');
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [urlSafe, setUrlSafe] = useState(false);
  const [jwtInfo, setJwtInfo] = useState<JwtInfo | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');

  const checkJWT = useCallback((base64String: string) => {
    if (base64String.startsWith('ey')) {
      try {
        const parts = base64String.split('.');
        if (parts.length === 3) {
          const header = JSON.parse(Base64.decode(parts[0])) as Record<string, unknown>;
          const payload = JSON.parse(Base64.decode(parts[1])) as Record<string, unknown>;
          const formatted = `[JWT Header]\n${JSON.stringify(header, null, 2)}\n\n[JWT Payload]\n${JSON.stringify(payload, null, 2)}`;
          setJwtInfo({ header, payload, formatted });
          return;
        }
      } catch {
        /* not JWT */
      }
    }
    setJwtInfo(null);
  }, []);

  const encode = useCallback(
    (text?: string) => {
      const val = text ?? input;
      if (!val) {
        setOutput('');
        setJwtInfo(null);
        return;
      }
      sound.playClick();
      try {
        let encoded = Base64.encode(val);
        if (urlSafe) {
          encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        }
        setOutput(encoded);
        checkJWT(encoded);
        sound.playSuccess();
      } catch (e) {
        const err = e as Error;
        setOutput('인코딩 오류: ' + err.message);
      }
    },
    [input, urlSafe, checkJWT]
  );

  const decode = useCallback(() => {
    if (!input) {
      setOutput('');
      setJwtInfo(null);
      return;
    }
    sound.playClick();
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
      sound.playSuccess();
    } catch (e) {
      const err = e as Error;
      setOutput('유효하지 않은 Base64 형식입니다: ' + err.message);
    }
  }, [input, urlSafe, checkJWT]);

  const showJwtPayload = useCallback(() => {
    if (jwtInfo) {
      sound.playClick();
      setOutput(jwtInfo.formatted);
    }
  }, [jwtInfo]);

  const setInput = useCallback(
    (v: string) => {
      setInputState(v);
      if (realtimeEnabled && v) {
        try {
          let encoded = Base64.encode(v);
          if (urlSafe) {
            encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
          }
          setOutput(encoded);
          checkJWT(encoded);
        } catch {
          /* skip */
        }
      } else if (!v) {
        setOutput('');
        setJwtInfo(null);
      }
    },
    [realtimeEnabled, urlSafe, checkJWT]
  );

  const copyOutput = useCallback(async (): Promise<boolean> => {
    if (!output) return false;
    sound.playClick();
    try {
      await navigator.clipboard.writeText(output);
      return true;
    } catch {
      return false;
    }
  }, [output]);

  const clearAll = useCallback(() => {
    sound.playReset();
    setInputState('');
    setOutput('');
    setJwtInfo(null);
  }, []);

  const loadSampleText = useCallback(
    (type: 'korean' | 'jwt' | 'json') => {
      sound.playClick();
      if (type === 'korean') {
        const text = '안녕하세요, VeraNex Base64 Studio입니다! ✨ 한글 UTF-8 인코딩을 지원합니다.';
        setInputState(text);
        let enc = Base64.encode(text);
        if (urlSafe) enc = enc.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        setOutput(enc);
        setJwtInfo(null);
      } else if (type === 'jwt') {
        const sampleJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlZlcmFOZXggVXNlciIsImFkbWluIjp0cnVlLCJpYXQiOjE3MTU4OTY0MDB9.4S-bL3WbJp-838D6Z4d_q5kP6kR8x1G8b1E2n_vL9w';
        setInputState(sampleJwt);
        decode();
      } else if (type === 'json') {
        const text = JSON.stringify({ service: 'VeraNex', tool: 'Base64 Studio', active: true, version: '2026' }, null, 2);
        setInputState(text);
        let enc = Base64.encode(text);
        if (urlSafe) enc = enc.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        setOutput(enc);
        setJwtInfo(null);
      }
      sound.playSuccess();
    },
    [urlSafe, decode]
  );

  const handleImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }
    sound.playClick();
    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageData(reader.result as string);
      sound.playSuccess();
    };
    reader.readAsDataURL(file);
  }, []);

  // 원클릭 샘플 이미지 로드 (Canvas로 400x400 배지 생성)
  const loadSampleImage = useCallback(() => {
    sound.playClick();
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 300, 300);

    const grad = ctx.createLinearGradient(30, 30, 270, 270);
    grad.addColorStop(0, '#4f46e5');
    grad.addColorStop(1, '#06b6d4');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(150, 150, 100, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VERA', 150, 150);

    const dataUrl = canvas.toDataURL('image/png');
    setImageData(dataUrl);
    setImageFileName('sample_badge.png');
    sound.playSuccess();
  }, []);

  const clearImage = useCallback(() => {
    sound.playReset();
    setImageData(null);
    setImageFileName('');
  }, []);

  const getImageCopyText = useCallback(
    (format: 'raw' | 'html' | 'css'): string => {
      if (!imageData) return '';
      sound.playClick();
      switch (format) {
        case 'raw':
          return imageData;
        case 'html':
          return `<img src="${imageData}" alt="${imageFileName || 'image'}" />`;
        case 'css':
          return `background-image: url('${imageData}');`;
      }
    },
    [imageData, imageFileName]
  );

  return {
    input,
    setInput,
    output,
    realtimeEnabled,
    setRealtimeEnabled,
    urlSafe,
    setUrlSafe,
    jwtInfo,
    encode,
    decode,
    showJwtPayload,
    copyOutput,
    clearAll,
    loadSampleText,
    imageData,
    imageFileName,
    handleImageFile,
    getImageCopyText,
    loadSampleImage,
    clearImage,
  };
}
