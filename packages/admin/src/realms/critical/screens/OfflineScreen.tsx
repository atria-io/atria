export const OfflineScreen = () => {
  const handleRetry = (): void => {
    window.location.reload();
  };

  return (
    <section>
      <h1>Offline</h1>
      <p>No connection available. Retry to continue.</p>
      <button type="button" onClick={handleRetry}>
        Retry
      </button>
    </section>
  );
};
