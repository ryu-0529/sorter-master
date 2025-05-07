import { useSwipeable, SwipeableHandlers, SwipeableProps } from 'react-swipeable';
import { useGame } from '../contexts/GameContext';

/**
 * スワイプ処理のカスタムフック
 * react-swipeableを使用してスワイプイベントを処理し、ゲームコンテキストのhandleSwipe関数と連携します
 * アニメーション効果を改善するため、設定を調整しています
 */
export const useSwipe = (): SwipeableHandlers => {
  const { handleSwipe } = useGame();
  
  // スワイプ設定
  const swipeConfig: SwipeableProps = {
    onSwipedUp: () => handleSwipe('up'),
    onSwipedRight: () => handleSwipe('right'),
    onSwipedDown: () => handleSwipe('down'),
    onSwipedLeft: () => handleSwipe('left'),
    // カスタムイベントを有効にする
    trackMouse: true, // マウスでもスワイプを検出
    trackTouch: true, // タッチでもスワイプを検出
    delta: 40, // スワイプと認識するための最小距離 (少し小さくして感度を上げる)
    preventScrollOnSwipe: true, // スワイプ中のスクロールを防止
    swipeDuration: 500, // スワイプが完了するまでの最大時間（ミリ秒）
    touchEventOptions: { passive: false }, // タッチイベントをキャンセルしてスクロールを防止
    rotationAngle: 0, // 回転角度の補正
  };
  
  // react-swipeableのフックを使用
  const swipeHandlers = useSwipeable(swipeConfig);
  
  return swipeHandlers;
};
