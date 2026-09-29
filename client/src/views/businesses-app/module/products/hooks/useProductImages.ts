import { useCallback, useState } from "react";
import type { AxiosError } from "axios";
import { toast } from "react-hot-toast";
import {
  createProductImageRequest,
  deleteProductImageRequest,
  getProductImagesRequest,
  reorderProductImagesRequest,
} from "../api/product-images.api";
import type {
  CreateProductImagePayload,
  ProductImageResponse,
} from "../types/product-images.types";
import type { ApiErrorResponse } from "../types/products.types";

const sortProductImages = (
  images: ProductImageResponse[],
): ProductImageResponse[] => {
  return [...images].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }

    return a.idProductImage - b.idProductImage;
  });
};

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const axiosError = error as AxiosError<ApiErrorResponse>;

  return axiosError.response?.data?.message || fallback;
};

export const useProductImages = () => {
  const [images, setImages] = useState<ProductImageResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadImages = useCallback(async (idProduct: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await getProductImagesRequest(idProduct);
      setImages(sortProductImages(response.data.data));
    } catch (requestError) {
      const message = getApiErrorMessage(
        requestError,
        "No se pudo cargar la galeria del producto",
      );

      setImages([]);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addImage = useCallback(
    async (idProduct: number, payload: CreateProductImagePayload) => {
      try {
        setMutating(true);
        setError(null);

        const response = await createProductImageRequest(idProduct, payload);
        setImages((currentImages) =>
          sortProductImages([...currentImages, response.data.data]),
        );
        toast.success(response.data.message || "Imagen agregada correctamente");
      } catch (requestError) {
        const message = getApiErrorMessage(
          requestError,
          "No se pudo agregar la imagen",
        );

        setError(message);
        toast.error(message);
        await loadImages(idProduct);
      } finally {
        setMutating(false);
      }
    },
    [loadImages],
  );

  const moveImage = useCallback(
    async (
      idProduct: number,
      idProductImage: number,
      direction: "up" | "down",
    ) => {
      const currentIndex = images.findIndex(
        (image) => image.idProductImage === idProductImage,
      );
      const targetIndex =
        direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (
        currentIndex < 0 ||
        targetIndex < 0 ||
        targetIndex >= images.length ||
        mutating
      ) {
        return;
      }

      const nextImages = [...images];
      const currentImage = nextImages[currentIndex];
      nextImages[currentIndex] = nextImages[targetIndex];
      nextImages[targetIndex] = currentImage;

      try {
        setMutating(true);
        setError(null);

        const response = await reorderProductImagesRequest(idProduct, {
          imageIds: nextImages.map((image) => image.idProductImage),
        });

        setImages(sortProductImages(response.data.data));
        toast.success(response.data.message || "Orden actualizado correctamente");
      } catch (requestError) {
        const message = getApiErrorMessage(
          requestError,
          "No se pudo actualizar el orden de la galeria",
        );

        setError(message);
        toast.error(message);
        await loadImages(idProduct);
      } finally {
        setMutating(false);
      }
    },
    [images, loadImages, mutating],
  );

  const deleteImage = useCallback(
    async (idProduct: number, idProductImage: number) => {
      try {
        setMutating(true);
        setError(null);

        const response = await deleteProductImageRequest(
          idProduct,
          idProductImage,
        );

        toast.success(response.data.message || "Imagen eliminada correctamente");
        await loadImages(idProduct);
      } catch (requestError) {
        const message = getApiErrorMessage(
          requestError,
          "No se pudo eliminar la imagen",
        );

        setError(message);
        toast.error(message);
        await loadImages(idProduct);
      } finally {
        setMutating(false);
      }
    },
    [loadImages],
  );

  const reset = useCallback(() => {
    setImages([]);
    setLoading(false);
    setMutating(false);
    setError(null);
  }, []);

  return {
    images,
    loading,
    mutating,
    error,
    loadImages,
    addImage,
    moveImage,
    deleteImage,
    reset,
  };
};
