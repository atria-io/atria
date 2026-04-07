export const CriticalErrorView = () => {
  const handleRetry = (): void => {
    window.location.reload();
  };

  return (
    <section>
      <h1>Critical Error</h1>
      <p>Runtime failed. Retry to continue.</p>
      <button type="button" onClick={handleRetry}>
        Retry
      </button>
    </section>
  );
};
