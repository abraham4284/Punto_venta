import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  FileText,
  List,
  Plus,
  Rows3,
  Trash2,
  Type,
} from "lucide-react";
import { Toaster } from "react-hot-toast";

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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useCan } from "@/views/businesses-app/hooks/useCan";
import { useProductRichContent } from "../../hooks/useProductRichContent";
import type {
  ProductRichContentBlock,
  ProductRichContentHeadingBlock,
  ProductRichContentListBlock,
  ProductRichContentSpecsBlock,
} from "../../types/product-rich-content.types";
import type { ProductResponse } from "../../types/products.types";
import {
  getProductRichContentErrorMessage,
  productRichContentSchema,
} from "../../validations/product-rich-content.validations";

type Props = {
  isOpen: boolean;
  product: ProductResponse | null;
  onClose: () => void;
};

type ProductRichContentBlockKind =
  | "heading"
  | "paragraph"
  | "list"
  | "specs";

const MAX_BLOCKS = 30;
const MAX_ITEMS = 30;

const blockLabels: Record<ProductRichContentBlockKind, string> = {
  heading: "Título",
  paragraph: "Párrafo",
  list: "Lista",
  specs: "Especificaciones",
};

const createDefaultBlock = (
  type: ProductRichContentBlockKind,
): ProductRichContentBlock => {
  if (type === "heading") {
    return {
      type: "heading",
      level: 2,
      text: "",
    };
  }

  if (type === "paragraph") {
    return {
      type: "paragraph",
      text: "",
    };
  }

  if (type === "list") {
    return {
      type: "list",
      style: "bullet",
      items: [""],
    };
  }

  return {
    type: "specs",
    items: [{ label: "", value: "" }],
  };
};

const getBlockIcon = (type: ProductRichContentBlockKind) => {
  if (type === "heading") return Type;
  if (type === "list") return List;
  if (type === "specs") return Rows3;

  return FileText;
};

export const ProductRichContentModal = ({ isOpen, product, onClose }: Props) => {
  const canUpdateProducts = useCan("products.update");
  const {
    loading,
    saving,
    error,
    loadRichContent,
    saveRichContent,
    reset,
  } = useProductRichContent();
  const [draftBlocks, setDraftBlocks] = useState<ProductRichContentBlock[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [contentReady, setContentReady] = useState(false);

  const productName = product?.name ?? "Producto";
  const blocksLimitReached = draftBlocks.length >= MAX_BLOCKS;
  const contentPending = Boolean(isOpen && product && !contentReady && !loadFailed);
  const showLoading = loading || contentPending;
  const controlsDisabled = showLoading || saving || loadFailed;
  const canEditContent = canUpdateProducts && !controlsDisabled;

  const emptyStateMessage = useMemo(() => {
    if (loadFailed) {
      return "No se pudo cargar el contenido detallado del producto.";
    }

    return "Todavía no hay contenido detallado para este producto.";
  }, [loadFailed]);

  useEffect(() => {
    if (!isOpen || !product) return;

    let mounted = true;

    void loadRichContent(product.idProduct)
      .then((richContent) => {
        if (!mounted) return;

        setDraftBlocks(richContent?.blocks ?? []);
        setContentReady(true);
      })
      .catch(() => {
        if (!mounted) return;

        setDraftBlocks([]);
        setLoadFailed(true);
        setContentReady(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, loadRichContent, product]);

  const handleOpenChange = (open: boolean) => {
    if (open) return;

    setDraftBlocks([]);
    setValidationError(null);
    setLoadFailed(false);
    setContentReady(false);
    reset();
    onClose();
  };

  const handleAddBlock = (type: ProductRichContentBlockKind) => {
    if (!canEditContent || blocksLimitReached) return;

    setDraftBlocks((currentBlocks) => [
      ...currentBlocks,
      createDefaultBlock(type),
    ]);
    setValidationError(null);
  };

  const handleUpdateBlock = (
    index: number,
    nextBlock: ProductRichContentBlock,
  ) => {
    if (!canEditContent) return;

    setDraftBlocks((currentBlocks) =>
      currentBlocks.map((block, blockIndex) =>
        blockIndex === index ? nextBlock : block,
      ),
    );
    setValidationError(null);
  };

  const handleMoveBlock = (index: number, direction: "up" | "down") => {
    if (!canEditContent) return;

    setDraftBlocks((currentBlocks) => {
      const nextIndex = direction === "up" ? index - 1 : index + 1;

      if (nextIndex < 0 || nextIndex >= currentBlocks.length) {
        return currentBlocks;
      }

      const nextBlocks = [...currentBlocks];
      const currentBlock = nextBlocks[index];
      nextBlocks[index] = nextBlocks[nextIndex];
      nextBlocks[nextIndex] = currentBlock;

      return nextBlocks;
    });
  };

  const handleDeleteBlock = (index: number) => {
    if (!canEditContent) return;

    setDraftBlocks((currentBlocks) =>
      currentBlocks.filter((_, blockIndex) => blockIndex !== index),
    );
    setValidationError(null);
  };

  const handleSave = async () => {
    if (!product || !canUpdateProducts || controlsDisabled) return;

    try {
      setValidationError(null);

      if (draftBlocks.length === 0) {
        await saveRichContent(product.idProduct, null);
        setDraftBlocks([]);
        return;
      }

      const parsed = productRichContentSchema.safeParse({
        version: 1,
        blocks: draftBlocks,
      });

      if (!parsed.success) {
        setValidationError(getProductRichContentErrorMessage(parsed.error));
        return;
      }

      const savedRichContent = await saveRichContent(
        product.idProduct,
        parsed.data,
      );

      setDraftBlocks(savedRichContent?.blocks ?? []);
    } catch {
      return;
    }
  };

  const renderHeadingEditor = (
    block: ProductRichContentHeadingBlock,
    index: number,
  ) => {
    return (
      <div className="grid gap-3 md:grid-cols-[140px_1fr]">
        <div className="grid gap-2">
          <Label>Nivel</Label>
          <Select
            value={String(block.level)}
            onValueChange={(value) => {
              if (value !== "2" && value !== "3") return;

              handleUpdateBlock(index, {
                ...block,
                level: Number(value) as ProductRichContentHeadingBlock["level"],
              });
            }}
          >
            <SelectTrigger className="w-full" disabled={!canEditContent}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="2">H2</SelectItem>
                <SelectItem value="3">H3</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Texto</Label>
          <Input
            maxLength={150}
            value={block.text}
            disabled={!canEditContent}
            placeholder="Ej: Beneficios principales"
            onChange={(event) =>
              handleUpdateBlock(index, {
                ...block,
                text: event.target.value,
              })
            }
          />
        </div>
      </div>
    );
  };

  const renderParagraphEditor = (
    block: Extract<ProductRichContentBlock, { type: "paragraph" }>,
    index: number,
  ) => {
    return (
      <div className="grid gap-2">
        <Label>Párrafo</Label>
        <Textarea
          maxLength={3000}
          value={block.text}
          disabled={!canEditContent}
          placeholder="Describí el producto con más detalle..."
          className="min-h-32"
          onChange={(event) =>
            handleUpdateBlock(index, {
              ...block,
              text: event.target.value,
            })
          }
        />
      </div>
    );
  };

  const renderListEditor = (
    block: ProductRichContentListBlock,
    index: number,
  ) => {
    const canRemoveItem = block.items.length > 1;
    const canAddItem = block.items.length < MAX_ITEMS;

    return (
      <div className="space-y-3">
        <div className="grid gap-2 md:w-52">
          <Label>Estilo</Label>
          <Select
            value={block.style}
            onValueChange={(value) => {
              if (value !== "bullet" && value !== "numbered") return;

              handleUpdateBlock(index, {
                ...block,
                style: value,
              });
            }}
          >
            <SelectTrigger className="w-full" disabled={!canEditContent}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="bullet">Viñetas</SelectItem>
                <SelectItem value="numbered">Numerada</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          {block.items.map((item, itemIndex) => (
            <div
              key={`${index}-${itemIndex}`}
              className="grid gap-2 sm:grid-cols-[1fr_auto]"
            >
              <Input
                maxLength={500}
                value={item}
                disabled={!canEditContent}
                placeholder={`Ítem ${itemIndex + 1}`}
                onChange={(event) => {
                  const nextItems = block.items.map(
                    (currentItem, currentIndex) =>
                      currentIndex === itemIndex
                        ? event.target.value
                        : currentItem,
                  );

                  handleUpdateBlock(index, {
                    ...block,
                    items: nextItems,
                  });
                }}
              />

              {canUpdateProducts && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  disabled={!canEditContent || !canRemoveItem}
                  title="Eliminar ítem"
                  aria-label={`Eliminar ítem ${itemIndex + 1}`}
                  onClick={() =>
                    handleUpdateBlock(index, {
                      ...block,
                      items: block.items.filter(
                        (_, currentIndex) => currentIndex !== itemIndex,
                      ),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {canUpdateProducts && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canEditContent || !canAddItem}
            onClick={() =>
              handleUpdateBlock(index, {
                ...block,
                items: [...block.items, ""],
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar ítem
          </Button>
        )}
      </div>
    );
  };

  const renderSpecsEditor = (
    block: ProductRichContentSpecsBlock,
    index: number,
  ) => {
    const canRemoveItem = block.items.length > 1;
    const canAddItem = block.items.length < MAX_ITEMS;

    return (
      <div className="space-y-3">
        {block.items.map((item, itemIndex) => (
          <div
            key={`${index}-${itemIndex}`}
            className="grid gap-2 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto]"
          >
            <Input
              maxLength={100}
              value={item.label}
              disabled={!canEditContent}
              placeholder="Etiqueta"
              onChange={(event) => {
                const nextItems = block.items.map(
                  (currentItem, currentIndex) =>
                    currentIndex === itemIndex
                      ? { ...currentItem, label: event.target.value }
                      : currentItem,
                );

                handleUpdateBlock(index, {
                  ...block,
                  items: nextItems,
                });
              }}
            />

            <Input
              maxLength={500}
              value={item.value}
              disabled={!canEditContent}
              placeholder="Valor"
              onChange={(event) => {
                const nextItems = block.items.map(
                  (currentItem, currentIndex) =>
                    currentIndex === itemIndex
                      ? { ...currentItem, value: event.target.value }
                      : currentItem,
                );

                handleUpdateBlock(index, {
                  ...block,
                  items: nextItems,
                });
              }}
            />

            {canUpdateProducts && (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={!canEditContent || !canRemoveItem}
                title="Eliminar especificación"
                aria-label={`Eliminar especificación ${itemIndex + 1}`}
                onClick={() =>
                  handleUpdateBlock(index, {
                    ...block,
                    items: block.items.filter(
                      (_, currentIndex) => currentIndex !== itemIndex,
                    ),
                  })
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}

        {canUpdateProducts && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canEditContent || !canAddItem}
            onClick={() =>
              handleUpdateBlock(index, {
                ...block,
                items: [...block.items, { label: "", value: "" }],
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar especificación
          </Button>
        )}
      </div>
    );
  };

  const renderBlockEditor = (
    block: ProductRichContentBlock,
    index: number,
  ) => {
    if (block.type === "heading") return renderHeadingEditor(block, index);
    if (block.type === "paragraph") return renderParagraphEditor(block, index);
    if (block.type === "list") return renderListEditor(block, index);

    return renderSpecsEditor(block, index);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Contenido detallado - {productName}
          </DialogTitle>
          <DialogDescription>
            Armá bloques de información para enriquecer la ficha pública del
            producto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Descripción corta</CardTitle>
              <CardDescription>
                La descripción corta se modifica desde Editar producto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                {product?.description?.trim() || "Sin descripción corta"}
              </div>
            </CardContent>
          </Card>

          {!canUpdateProducts && (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
              Tenés acceso de lectura. Para modificar el contenido necesitás
              permiso de edición de productos.
            </div>
          )}

          {showLoading ? (
            <div className="flex items-center justify-center gap-3 rounded-lg border py-12 text-sm text-muted-foreground">
              <Spinner />
              Cargando contenido...
            </div>
          ) : (
            <Card>
              <CardHeader className="gap-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>Bloques de contenido</CardTitle>
                    <CardDescription>
                      Organizá títulos, textos, listas y especificaciones.
                    </CardDescription>
                  </div>
                  <Badge variant={blocksLimitReached ? "destructive" : "outline"}>
                    {draftBlocks.length}/{MAX_BLOCKS}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {canUpdateProducts && (
                  <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/20 p-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!canEditContent || blocksLimitReached}
                      onClick={() => handleAddBlock("heading")}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Título
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!canEditContent || blocksLimitReached}
                      onClick={() => handleAddBlock("paragraph")}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Párrafo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!canEditContent || blocksLimitReached}
                      onClick={() => handleAddBlock("list")}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Lista
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!canEditContent || blocksLimitReached}
                      onClick={() => handleAddBlock("specs")}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Especificaciones
                    </Button>
                  </div>
                )}

                {draftBlocks.length === 0 ? (
                  <div className="rounded-lg border py-12 text-center text-sm text-muted-foreground">
                    {emptyStateMessage}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {draftBlocks.map((block, index) => {
                      const Icon = getBlockIcon(block.type);

                      return (
                        <Card key={`${block.type}-${index}`}>
                          <CardHeader className="gap-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div>
                                  <CardTitle className="text-sm">
                                    {blockLabels[block.type]}
                                  </CardTitle>
                                  <CardDescription>
                                    Posición {index + 1}
                                  </CardDescription>
                                </div>
                              </div>

                              {canUpdateProducts && (
                                <div className="flex flex-wrap gap-2 sm:justify-end">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon-sm"
                                    title="Subir bloque"
                                    aria-label={`Subir bloque ${index + 1}`}
                                    disabled={!canEditContent || index === 0}
                                    onClick={() => handleMoveBlock(index, "up")}
                                  >
                                    <ArrowUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon-sm"
                                    title="Bajar bloque"
                                    aria-label={`Bajar bloque ${index + 1}`}
                                    disabled={
                                      !canEditContent ||
                                      index === draftBlocks.length - 1
                                    }
                                    onClick={() =>
                                      handleMoveBlock(index, "down")
                                    }
                                  >
                                    <ArrowDown className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon-sm"
                                    title="Eliminar bloque"
                                    aria-label={`Eliminar bloque ${index + 1}`}
                                    disabled={!canEditContent}
                                    onClick={() => handleDeleteBlock(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>{renderBlockEditor(block, index)}</CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {validationError && (
                  <p className="text-sm text-destructive">{validationError}</p>
                )}

                {error && !loading && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cerrar
          </Button>
          {canUpdateProducts && (
            <Button
              type="button"
              disabled={controlsDisabled}
              onClick={handleSave}
            >
              {saving && <Spinner className="mr-2 h-4 w-4" />}
              Guardar contenido
            </Button>
          )}
        </DialogFooter>
        <Toaster position="top-right" reverseOrder={false} />
      </DialogContent>
    </Dialog>
  );
};
