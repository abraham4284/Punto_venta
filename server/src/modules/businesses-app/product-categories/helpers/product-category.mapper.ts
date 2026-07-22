import type {
  ProductCategoryDbRow,
  ProductCategoryResponse,
} from "../types/product-category.types.js";

export function mapProductCategory(
  productCategory: ProductCategoryDbRow,
): ProductCategoryResponse {
  return {
    idProductCategory: productCategory.idProductCategory,
    idBusiness: productCategory.idBusiness,
    name: productCategory.name,
    description: productCategory.description,
    isDefault: Boolean(productCategory.is_default),
    isActive: Boolean(productCategory.is_active),
    createdAt: productCategory.created_at,
    updatedAt: productCategory.updated_at,
  };
}
