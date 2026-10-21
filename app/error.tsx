"use client";

import { Container } from "@/components/ui/bits";
import { Button, ButtonLink } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="text-gold font-display text-6xl italic">Hmm.</p>
      <h1 className="mt-5 text-2xl font-semibold tracking-[-0.02em]">Something on this page broke.</h1>
      <p className="mt-3 max-w-md text-muted">It’s on us, not you. Try again, or head back to the marketplace.</p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/explore" variant="outline">
          Explore
        </ButtonLink>
      </div>
    </Container>
  );
}
