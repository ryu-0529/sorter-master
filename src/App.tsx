import React, { useEffect, useState } from 'react';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdMobProvider } from './contexts/AdMobContext';
import { GameProvider } from './contexts/GameContext';

// Pages
import WelcomePage from './pages/WelcomePage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GameModePage from './pages/GameModePage';
import GamePlayPage from './pages/GamePlayPage';
import ResultPage from './pages/ResultPage';
import ProfilePage from './pages/ProfilePage';
import JoinRoomPage from './pages/JoinRoomPage';
import CreateRoomPage from './pages/rooms/CreateRoomPage';
import NotFoundPage from './pages/NotFoundPage';

// Chakra UIテーマのカスタマイズ
const theme = extendTheme({
  colors: {
    brand: {
      50: '#e6f7ff',
      100: '#b3e0ff',
      200: '#80caff',
      300: '#4db3ff',
      400: '#1a9dff',
      500: '#0080ff', // プライマリカラー
      600: '#0066cc',
      700: '#004d99',
      800: '#003366',
      900: '#001a33',
    },
  },
  fonts: {
    heading: "'Noto Sans JP', sans-serif",
    body: "'Noto Sans JP', sans-serif",
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
      },
    },
  },
});

function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // デバッグ情報をコンソールに出力
    console.log('=== 仕分け職人 App コンポーネントがマウントされました ===');
    console.log('React version:', React.version);
    console.log('User Agent:', navigator.userAgent);
    console.log('Location:', window.location.href);
    console.log('Document ready state:', document.readyState);
    
    // Capacitor環境のチェック
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      console.log('Capacitor環境で実行中:', (window as any).Capacitor.getPlatform());
      console.log('Capacitorバージョン:', (window as any).Capacitor);
    } else {
      console.log('ブラウザ環境で実行中');
    }
    
    // DOM要素の確認
    const rootElement = document.getElementById('root');
    if (rootElement) {
      console.log('Root要素が見つかりました:', rootElement);
      console.log('Root要素のchildren:', rootElement.children.length);
    } else {
      console.error('Root要素が見つかりません！');
    }
    
    // ページロード完了時に追加情報をログ
    const handleLoad = () => {
      console.log('ページのロードが完了しました');
      console.log('Document.body:', document.body);
    };
    
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  // 初期化処理
  useEffect(() => {
    try {
      console.log('アプリケーションの初期化を開始します...');
      
      // 少し遅延を入れてCapacitorの初期化を待つ
      setTimeout(() => {
        console.log('初期化完了！');
        setIsReady(true);
      }, 100);
    } catch (err) {
      console.error('初期化エラー:', err);
      setError(err as Error);
    }
  }, []);

  console.log('Appコンポーネントがレンダリング中...');
  console.log('isReady:', isReady);

  // エラー状態の場合
  if (error) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100vh', 
        backgroundColor: '#ff6b6b',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}>
        <h1>🔴 エラーが発生しました</h1>
        <pre style={{ 
          backgroundColor: 'rgba(0,0,0,0.2)', 
          padding: '20px', 
          borderRadius: '8px',
          maxWidth: '80%',
          overflow: 'auto'
        }}>
          {error.toString()}
        </pre>
      </div>
    );
  }

  // 初期化待ち状態の場合
  if (!isReady) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100vh', 
        backgroundColor: '#0080ff',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🚗 仕分け職人</h1>
        <p>アプリケーションを初期化中...</p>
      </div>
    );
  }

  // メインのアプリケーション
  console.log('メインアプリケーションをレンダリング中...');
  
  // デバッグ用: シンプルなHTMLを表示
  if ((window as any).debugMode === true) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100vh', 
        backgroundColor: '#4caf50',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '24px'
      }}>
        <h1>🎉 Reactアプリが動作しています！</h1>
        <p>ChakraUIを無効化中...</p>
      </div>
    );
  }
  
  // ChakraProviderをラップしてエラーをキャッチ
  try {
    return (
      <ChakraProvider theme={theme}>
        <AuthProvider>
          <AdMobProvider>
            <GameProvider>
              <Router>
                <Routes>
                  <Route path="/" element={<WelcomePage />} />
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/modes" element={<GameModePage />} />
                  <Route path="/game-mode" element={<GameModePage />} />
                  <Route path="/game-play" element={<GamePlayPage />} />
                  <Route path="/result" element={<ResultPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/join-room" element={<JoinRoomPage />} />
                  <Route path="/create-room" element={<CreateRoomPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Router>
            </GameProvider>
          </AdMobProvider>
        </AuthProvider>
      </ChakraProvider>
    );
  } catch (renderError) {
    console.error('レンダリングエラー:', renderError);
    return (
      <div style={{ 
        width: '100%', 
        height: '100vh', 
        backgroundColor: '#f44336',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}>
        <h1>レンダリングエラー</h1>
        <pre>{String(renderError)}</pre>
      </div>
    );
  }
}

export default App;
