import { useSwipeable, SwipeableHandlers, SwipeableProps } from 'react-swipeable';
import { useGame } from '../contexts/GameContext';

/**
 * スワイプ処理のカスタムフック
 * react-swipeableを使用してスワイプイベントを処理し、ゲームコンテキストのhandleSwipe関数と連携します
 */
export const useSwipe = (): SwipeableHandlers => {
  const { handleSwipe } = useGame();
  
  // スワイプ設定
  const swipeConfig: SwipeableProps = {
    onSwipedUp: () => handleSwipe('up'),
    onSwipedRight: () => handleSwipe('right'),
    onSwipedDown: () => handleSwipe('down'),
    onSwipedLeft: () => handleSwipe('left'),
    // preventDefaultTouchmoveEvent プロパティは最新のreact-swipeableでは使用できないため削除
    // 代わりに同等の機能を持つpropertyを使用
    touchEventOptions: { passive: false }, // タッチイベントをキャンセルしてスクロールを防止
    trackMouse: true, // マウスでもスワイプを検出
    trackTouch: true, // タッチでもスワイプを検出
    delta: 50, // スワイプと認識するための最小距離
    // minDistance プロパティも react-swipeable の最新バージョンではサポートされていないため削除
    rotationAngle: 0, // 回転角度の補正
  };
  
  // react-swipeableのフックを使用
  const swipeHandlers = useSwipeable(swipeConfig);
  
  return swipeHandlers;
};
