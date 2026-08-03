(() => {
  const removeSeismicSummary = () => {
    const heading = document.querySelector('.header h1');
    if (!heading || heading.textContent.trim() !== 'Engmetclima') return;

    document.querySelectorAll('.card').forEach(card => {
      const title = card.querySelector('.card-title');
      if (title && title.textContent.trim().toLowerCase() === 'boletim sísmico') {
        card.remove();
      }
    });
  };

  new MutationObserver(removeSeismicSummary).observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  document.addEventListener('DOMContentLoaded', removeSeismicSummary);
  window.addEventListener('load', removeSeismicSummary);
})();
