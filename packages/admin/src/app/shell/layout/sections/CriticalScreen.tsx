export interface CriticalScreenProps {
  message: string;
}

export const CriticalScreen = ({ message }: CriticalScreenProps) => {
  const handleRetry = (): void => {
    window.location.reload();
  };

  return (
    <section>
      <h1>Critical Error</h1>
      <p>{message}</p>
      <button type="button" onClick={handleRetry}>
        Retry
      </button>
    </section>
  );
};
