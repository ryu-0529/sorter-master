import { useSwipeable, SwipeableHandlers, SwipeableProps } from 'react-swipeable';
import { useGame } from '../contexts/GameContext';

/**
 * スワイプ処理のカスタムフック
 * react-swipeableを使用してスワイプイベントを処理し、ゲームコンテキストのhandleSwipe関数と連携します
 * アニメーション効果を改善するため、設定を調整しています
 */
export const useSwipe = (onSwiping?: (deltaX: number, deltaY: number) => void): SwipeableHandlers => {
  const { handleSwipe } = useGame();
  
  // スワイプ設定
  const swipeConfig: SwipeableProps = {
    // 注: 実際のスワイプ処理は GamePlayPage の calculateSwipeDirection で行うため、
    // 以下のハンドラは使用されません。ただし念のため残しておきます。
    onSwipedUp: () => handleSwipe('up'),
    onSwipedRight: () => handleSwipe('right'),
    onSwipedDown: () => handleSwipe('down'),
    onSwipedLeft: () => handleSwipe('left'),
    // スワイプ中のイベント
    onSwiping: (event) => {
      if (onSwiping) {
        onSwiping(event.deltaX, event.deltaY);
      }
    },
    // カスタムイベントを有効にする
    trackMouse: true, // マウスでもスワイプを検出
    trackTouch: true, // タッチでもスワイプを検出
    delta: 5, // スワイプと認識するための最小距離（さらに小さくして敏感に反応）
    preventScrollOnSwipe: true, // スワイプ中のスクロールを防止
    swipeDuration: 1000, // スワイプが完了するまでの最大時間（ミリ秒）（長めに設定）
    touchEventOptions: { passive: false }, // タッチイベントをキャンセルしてスクロールを防止
    rotationAngle: 0, // 回転角度の補正
  };
  
  // react-swipeableのフックを使用
  const swipeHandlers = useSwipeable(swipeConfig);
  
  return swipeHandlers;
};
