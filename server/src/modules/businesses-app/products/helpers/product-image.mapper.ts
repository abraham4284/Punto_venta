import type {
  ProductImageDbRow,
  ProductImageResponse,
} from "../types/product-images.types.js";

export function mapProductImage(
  image: ProductImageDbRow,
): ProductImageResponse {
  return {
    idProductImage: image.idProductImage,
    idProduct: image.idProduct,
    imageUrl: image.image_url,
    altText: image.alt_text,
    sortOrder: Number(image.sort_order),
    createdAt: image.created_at,
    updatedAt: image.updated_at,
  };
}
