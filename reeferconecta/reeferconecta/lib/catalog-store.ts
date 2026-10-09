import { localStore, type CustomCatalogPart as StoredCustomPart } from "@/lib/local-store";
import { type CatalogEntry } from "@/lib/catalog";

export type CustomCatalogPart = StoredCustomPart;
export type CatalogListItem = CatalogEntry & { source: "static" | "custom"; id?: string };

export async function getCustomCatalogParts(fabricante?: string): Promise<(CustomCatalogPart & { id: string })[]> {
  return localStore.getCustomCatalogParts(fabricante);
}

export async function addCustomCatalogPart(
  part: Omit<CustomCatalogPart, "id" | "createdAt">,
): Promise<CustomCatalogPart & { id: string }> {
  return localStore.addCustomCatalogPart(part);
}

export async function deleteCustomCatalogPart(id: string): Promise<boolean> {
  return localStore.deleteCustomCatalogPart(id);
}

export async function hideStaticCatalogPart(fabricante: string, descricao: string): Promise<void> {
  localStore.hideStaticCatalogPart(fabricante, descricao);
}

export async function getAllCatalogParts(): Promise<CatalogListItem[]> {
  return localStore.getAllCatalogParts();
}
