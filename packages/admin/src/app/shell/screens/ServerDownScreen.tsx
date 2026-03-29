export const ServerDownScreen = () => {
  const handleRetry = (): void => {
    window.location.reload();
  };

  return (
    <section>
      <h1>Server Unavailable</h1>
      <p>Server is currently unavailable. Retry to continue.</p>
      <button type="button" onClick={handleRetry}>
        Retry
      </button>
    </section>
  );
};
