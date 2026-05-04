export default function LoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div
        className="h-8 w-8 animate-spin rounded-full"
        style={{
          border: "3px solid var(--surface-200)",
          borderTopColor: "var(--accent-indigo)",
        }}
      />
    </div>
  );
}
