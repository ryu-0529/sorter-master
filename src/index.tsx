import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

console.log('=== index.tsx が実行されました ===');
console.log('React:', React);
console.log('ReactDOM:', ReactDOM);
console.log('Document readyState:', document.readyState);
console.log('Window location:', window.location.href);

// Root要素の確認
const rootElementId = 'root';
const rootElement = document.getElementById(rootElementId);

if (!rootElement) {
  console.error(`❌ ID「${rootElementId}」の要素が見つかりません！`);
  console.log('利用可能な要素:', document.body.innerHTML);
} else {
  console.log('✅ Root要素が見つかりました:', rootElement);
  console.log('Root要素のクラス:', rootElement.className);
  console.log('Root要素の属性:', rootElement.attributes);
}

try {
  console.log('React DOMのrootを作成中...');
  const root = ReactDOM.createRoot(rootElement as HTMLElement);
  console.log('✅ React DOM rootが作成されました:', root);
  
  console.log('Appコンポーネントをレンダリング中...');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('✅ Appコンポーネントのレンダリングが完了しました');
} catch (error) {
  console.error('❌ React DOM renderでエラーが発生しました:', error);
  console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
}

// パフォーマンス計測
try {
  reportWebVitals((metric) => {
    console.log('📊 Web Vitals:', metric);
  });
} catch (error) {
  console.error('❌ reportWebVitalsでエラーが発生しました:', error);
}

console.log('=== index.tsx の実行が完了しました ===');
