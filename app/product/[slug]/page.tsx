import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRODUCTS, getProduct } from "@/lib/catalog";
import { seededReviews } from "@/lib/reviews";
import { ProductDetail } from "@/components/product/detail";

export const dynamicParams = false;

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getProduct((await params).slug);
  return p ? { title: p.title, description: p.tagline } : {};
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = getProduct((await params).slug);
  if (!product) notFound();
  const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 4);
  return <ProductDetail product={product} seededReviews={seededReviews(product)} related={related} />;
}
