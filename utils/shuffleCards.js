export const shuffleCards = (cards) => {
  const shuffledCards = [...cards];

  for (let i = shuffledCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledCards[i], shuffledCards[j]] = [shuffledCards[j], shuffledCards[i]];
  }

  for (let i = 0; i < shuffledCards.length; i++) {
    const nextIndex = (i + 1) % shuffledCards.length;
    shuffledCards[i].selected_by = shuffledCards[nextIndex].created_by;
  }

  return shuffledCards;
};
