import { Button, EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-6 pt-24">
      <EmptyState title="Frame dropped." desc="We couldn't find that page. It may have moved, or it isn't in the catalog yet." action={<Button href="/games" variant="primary">Browse games</Button>} />
    </div>
  );
}
