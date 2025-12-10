const sounds = {
  levelup: new Audio("/sounds/levelup.mp3"),
  equip: new Audio("/sounds/equip.mp3"),
  itemOpen: new Audio("/sounds/itemOpen.mp3"),
  sell: new Audio("/sounds/sell.mp3"),
  destroy: new Audio("/sounds/destroy.mp3")
};

export function playSound(name) {
  const sound = sounds[name];
  if (!sound) return;

  sound.playbackRate = 0.9 + Math.random() * 0.2;

  sound.currentTime = 0;
  sound.volume = 0.7;
  sound.play();
}
