import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  ImageIcon,
  Images,
  Plus,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useCan } from "@/views/businesses-app/hooks/useCan";
import { useProductImages } from "../../hooks/useProductImages";
import type { ProductResponse } from "../../types/products.types";

type Props = {
  isOpen: boolean;
  product: ProductResponse | null;
  onClose: () => void;
};

const MAX_GALLERY_IMAGES = 10;

const initialForm = {
  imageUrl: "",
  altText: "",
};

const isValidUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const ProductGalleryModal = ({ isOpen, product, onClose }: Props) => {
  const canUpdateProducts = useCan("products.update");
  const {
    images,
    loading,
    mutating,
    error,
    loadImages,
    addImage,
    moveImage,
    deleteImage,
    reset,
  } = useProductImages();
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState<string | null>(null);

  const galleryIsFull = images.length >= MAX_GALLERY_IMAGES;
  const controlsDisabled = mutating || loading;
  const sortedImages = useMemo(() => {
    return [...images].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.idProductImage - b.idProductImage;
    });
  }, [images]);

  useEffect(() => {
    if (!isOpen || !product) return;

    void loadImages(product.idProduct);
  }, [isOpen, loadImages, product]);

  const handleOpenChange = (open: boolean) => {
    if (open) return;

    setForm(initialForm);
    setFormError(null);
    reset();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!product || controlsDisabled || galleryIsFull) return;

    const imageUrl = form.imageUrl.trim();
    const altText = form.altText.trim();

    if (!imageUrl) {
      setFormError("La URL de la imagen es obligatoria");
      return;
    }

    if (imageUrl.length > 500) {
      setFormError("La URL de la imagen no puede superar los 500 caracteres");
      return;
    }

    if (!isValidUrl(imageUrl)) {
      setFormError("Ingresa una URL valida con http o https");
      return;
    }

    if (altText.length > 255) {
      setFormError("El texto alternativo no puede superar los 255 caracteres");
      return;
    }

    setFormError(null);
    await addImage(product.idProduct, {
      imageUrl,
      altText: altText || null,
    });
    setForm(initialForm);
  };

  const handleMove = (
    idProductImage: number,
    direction: "up" | "down",
  ) => {
    if (!product || controlsDisabled) return;

    void moveImage(product.idProduct, idProductImage, direction);
  };

  const handleDelete = (idProductImage: number) => {
    if (!product || controlsDisabled) return;

    void deleteImage(product.idProduct, idProductImage);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Images className="h-5 w-5 text-primary" />
            Galería - {product?.name ?? "Producto"}
          </DialogTitle>
          <DialogDescription>
            Gestioná la portada y las imágenes adicionales del producto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader className="gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>Portada</CardTitle>
                <Badge variant="secondary">Portada principal</Badge>
              </div>
              <CardDescription>
                La portada se modifica desde Editar producto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-center">
                {product?.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="aspect-video w-full rounded-lg border bg-background object-cover sm:w-48"
                  />
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center rounded-lg border bg-background text-muted-foreground sm:w-48">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium">{product?.name ?? "Producto"}</p>
                  <p className="text-sm text-muted-foreground">
                    Esta imagen sigue siendo la portada del catálogo interno,
                    ventas, stock e importación.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>Imágenes adicionales</CardTitle>
                <Badge variant={galleryIsFull ? "destructive" : "outline"}>
                  {sortedImages.length}/{MAX_GALLERY_IMAGES}
                </Badge>
              </div>
              <CardDescription>
                Estas imágenes complementan la portada del producto.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {canUpdateProducts && (
                <form className="grid gap-3 rounded-lg border p-3" onSubmit={handleSubmit}>
                  <div className="grid gap-2">
                    <Label htmlFor="galleryImageUrl">URL de imagen *</Label>
                    <Input
                      id="galleryImageUrl"
                      type="url"
                      maxLength={500}
                      placeholder="https://..."
                      value={form.imageUrl}
                      disabled={controlsDisabled || galleryIsFull}
                      aria-invalid={Boolean(formError)}
                      onChange={(event) => {
                        setForm((currentForm) => ({
                          ...currentForm,
                          imageUrl: event.target.value,
                        }));
                        setFormError(null);
                      }}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="galleryAltText">Texto alternativo</Label>
                    <Input
                      id="galleryAltText"
                      maxLength={255}
                      placeholder="Vista lateral del producto"
                      value={form.altText}
                      disabled={controlsDisabled || galleryIsFull}
                      onChange={(event) =>
                        setForm((currentForm) => ({
                          ...currentForm,
                          altText: event.target.value,
                        }))
                      }
                    />
                  </div>

                  {formError && (
                    <p className="text-sm text-destructive">{formError}</p>
                  )}

                  {galleryIsFull && (
                    <p className="text-sm text-muted-foreground">
                      Alcanzaste el máximo de 10 imágenes adicionales.
                    </p>
                  )}

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={controlsDisabled || galleryIsFull}
                    >
                      {mutating ? (
                        <Spinner className="mr-2 h-4 w-4" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      Agregar imagen
                    </Button>
                  </div>
                </form>
              )}

              {!canUpdateProducts && (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                  Tenés acceso de lectura. Para agregar, ordenar o eliminar
                  imágenes necesitás permiso de edición de productos.
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center gap-3 rounded-lg border py-10 text-sm text-muted-foreground">
                  <Spinner />
                  Cargando galería...
                </div>
              ) : sortedImages.length === 0 ? (
                <div className="rounded-lg border py-10 text-center text-sm text-muted-foreground">
                  Todavía no hay imágenes adicionales.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {sortedImages.map((image, index) => (
                    <div
                      key={image.idProductImage}
                      className="overflow-hidden rounded-lg border bg-background"
                    >
                      <img
                        src={image.imageUrl}
                        alt={image.altText || product?.name || "Imagen de producto"}
                        className="aspect-video w-full bg-muted object-cover"
                      />

                      <div className="space-y-3 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {image.altText || "Sin texto alternativo"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Posición {index + 1}
                            </p>
                          </div>
                          <Badge variant="outline">#{index + 1}</Badge>
                        </div>

                        {canUpdateProducts && (
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              title={`Subir imagen ${index + 1}`}
                              aria-label={`Subir imagen ${index + 1}`}
                              disabled={controlsDisabled || index === 0}
                              onClick={() => handleMove(image.idProductImage, "up")}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              title={`Bajar imagen ${index + 1}`}
                              aria-label={`Bajar imagen ${index + 1}`}
                              disabled={
                                controlsDisabled ||
                                index === sortedImages.length - 1
                              }
                              onClick={() =>
                                handleMove(image.idProductImage, "down")
                              }
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger
                                render={
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon-sm"
                                    title={`Eliminar imagen ${index + 1}`}
                                    aria-label={`Eliminar imagen ${index + 1}`}
                                    disabled={controlsDisabled}
                                  />
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Eliminar imagen</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    La imagen se quitará de la galería del producto.
                                    Esta acción no modifica la portada.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(image.idProductImage)}
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {error && !loading && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
