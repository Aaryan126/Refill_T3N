import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import type { ProductCategory } from "@/lib/types";

export async function GET(request: Request) {
  const store = getStore();
  const url = new URL(request.url);
  const category = url.searchParams.get("category") as ProductCategory | null;
  const products = category ? store.products.filter((product) => product.category === category) : store.products;

  return NextResponse.json(products);
}
