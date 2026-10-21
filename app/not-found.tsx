import { Container } from "@/components/ui/bits";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
      <p className="text-gold font-display text-[8rem] italic leading-none">404</p>
      <h1 className="mt-6 text-2xl font-semibold tracking-[-0.02em]">This page went off to train a new model.</h1>
      <p className="mt-3 max-w-md text-muted">The thing you’re looking for doesn’t exist, or it was moved. Let’s get you back to the good stuff.</p>
      <div className="mt-8 flex gap-3">
        <ButtonLink href="/explore">Explore the marketplace</ButtonLink>
        <ButtonLink href="/" variant="outline">
          Home
        </ButtonLink>
      </div>
    </Container>
  );
}
