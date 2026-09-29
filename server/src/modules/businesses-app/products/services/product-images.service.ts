import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { pool } from "@/db/db.js";
import { mapProductImage } from "../helpers/product-image.mapper.js";
import type {
  CreateProductImagePayload,
  ProductImageDbRow,
  ProductImageResponse,
  ReorderProductImagesPayload,
  UpdateProductImageSortOrderInput,
} from "../types/product-images.types.js";

const MAX_PRODUCT_GALLERY_IMAGES = 10;

function extractProductImages(rows: RowDataPacket[]): ProductImageResponse[] {
  const result = rows as unknown as ProductImageDbRow[][];

  return (result[0] ?? []).map(mapProductImage);
}

function assertExactSameImageSet(
  currentImages: ProductImageResponse[],
  nextImageIds: number[],
): void {
  const currentIds = currentImages
    .map(function mapImageId(image) {
      return image.idProductImage;
    })
    .sort(function sortNumbers(a, b) {
      return a - b;
    });

  const requestedIds = [...nextImageIds].sort(function sortNumbers(a, b) {
    return a - b;
  });

  if (currentIds.length !== requestedIds.length) {
    throw new Error("Debes enviar exactamente todas las imagenes actuales de la galeria");
  }

  for (let index = 0; index < currentIds.length; index += 1) {
    if (currentIds[index] !== requestedIds[index]) {
      throw new Error("El orden enviado no coincide con la galeria actual del producto");
    }
  }
}

async function lockProductForGallery(
  connection: PoolConnection,
  idBusiness: number,
  idProduct: number,
): Promise<void> {
  await connection.query<RowDataPacket[]>(
    "CALL sp_lock_product_for_gallery(?, ?)",
    [idBusiness, idProduct],
  );
}

export async function getProductImagesService(
  idBusiness: number,
  idProduct: number,
): Promise<ProductImageResponse[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "CALL sp_get_product_images(?, ?)",
    [idBusiness, idProduct],
  );

  return extractProductImages(rows);
}

export async function createProductImageService(
  data: CreateProductImagePayload,
): Promise<ProductImageResponse> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await lockProductForGallery(connection, data.idBusiness, data.idProduct);

    const [currentRows] = await connection.query<RowDataPacket[]>(
      "CALL sp_get_product_images(?, ?)",
      [data.idBusiness, data.idProduct],
    );
    const currentImages = extractProductImages(currentRows);

    if (currentImages.length >= MAX_PRODUCT_GALLERY_IMAGES) {
      throw new Error("La galeria del producto no puede superar las 10 imagenes");
    }

    const [rows] = await connection.query<RowDataPacket[]>(
      "CALL sp_create_product_image(?, ?, ?, ?)",
      [
        data.idBusiness,
        data.idProduct,
        data.imageUrl,
        data.altText ?? null,
      ],
    );

    const createdImage = extractProductImages(rows)[0];

    if (!createdImage) {
      throw new Error("No se pudo agregar la imagen al producto");
    }

    await connection.commit();

    return createdImage;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteProductImageService(
  idBusiness: number,
  idProduct: number,
  idProductImage: number,
): Promise<void> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await lockProductForGallery(connection, idBusiness, idProduct);

    await connection.query<RowDataPacket[]>(
      "CALL sp_delete_product_image(?, ?, ?)",
      [idBusiness, idProduct, idProductImage],
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateProductImageSortOrder(
  connection: PoolConnection,
  data: UpdateProductImageSortOrderInput,
): Promise<void> {
  await connection.query<RowDataPacket[]>(
    "CALL sp_update_product_image_sort_order(?, ?, ?, ?)",
    [
      data.idBusiness,
      data.idProduct,
      data.idProductImage,
      data.sortOrder,
    ],
  );
}

export async function reorderProductImagesService(
  data: ReorderProductImagesPayload,
): Promise<ProductImageResponse[]> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await lockProductForGallery(connection, data.idBusiness, data.idProduct);

    const [currentRows] = await connection.query<RowDataPacket[]>(
      "CALL sp_get_product_images(?, ?)",
      [data.idBusiness, data.idProduct],
    );
    const currentImages = extractProductImages(currentRows);

    assertExactSameImageSet(currentImages, data.imageIds);

    for (let index = 0; index < data.imageIds.length; index += 1) {
      await updateProductImageSortOrder(connection, {
        idBusiness: data.idBusiness,
        idProduct: data.idProduct,
        idProductImage: data.imageIds[index],
        sortOrder: index,
      });
    }

    const [updatedRows] = await connection.query<RowDataPacket[]>(
      "CALL sp_get_product_images(?, ?)",
      [data.idBusiness, data.idProduct],
    );
    const updatedImages = extractProductImages(updatedRows);

    await connection.commit();

    return updatedImages;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
