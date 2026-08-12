import Decimal from "decimal.js";
import { create } from "zustand";
import type { PurchaseCartItem } from "../types";

type PurchaseCartState = {
  cart: PurchaseCartItem[];
  addItem: (item: PurchaseCartItem) => void;
  removeItem: (idProduct: number, idDeposit: number) => void;
  updateItem: (
    idProduct: number,
    idDeposit: number,
    nextItem: Partial<PurchaseCartItem>,
  ) => void;
  clearCart: () => void;
};

const roundMoney = (value: Decimal): number => {
  return Number(value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString());
};

const calculateSubtotal = (
  quantity: number,
  unitPrice: number,
  discountAmount: number,
): number => {
  return roundMoney(
    new Decimal(quantity).mul(unitPrice).minus(discountAmount),
  );
};

export const usePurchaseCartStore = create<PurchaseCartState>((set) => ({
  cart: [],

  addItem: (item) => {
    set((state) => {
      const existingIndex = state.cart.findIndex((cartItem) => {
        return (
          cartItem.idProduct === item.idProduct &&
          cartItem.idDeposit === item.idDeposit
        );
      });

      if (existingIndex < 0) {
        return {
          cart: [...state.cart, item],
        };
      }

      return {
        cart: state.cart.map((cartItem, index) => {
          if (index !== existingIndex) return cartItem;

          const quantity = new Decimal(cartItem.quantity)
            .plus(item.quantity)
            .toNumber();
          const discountAmount = roundMoney(
            new Decimal(cartItem.discountAmount).plus(item.discountAmount),
          );

          return {
            ...cartItem,
            quantity,
            unitPrice: item.unitPrice,
            discountAmount,
            subtotal: calculateSubtotal(
              quantity,
              item.unitPrice,
              discountAmount,
            ),
          };
        }),
      };
    });
  },

  removeItem: (idProduct, idDeposit) => {
    set((state) => ({
      cart: state.cart.filter((item) => {
        return item.idProduct !== idProduct || item.idDeposit !== idDeposit;
      }),
    }));
  },

  updateItem: (idProduct, idDeposit, nextItem) => {
    set((state) => ({
      cart: state.cart.map((item) => {
        if (item.idProduct !== idProduct || item.idDeposit !== idDeposit) {
          return item;
        }

        const quantity = nextItem.quantity ?? item.quantity;
        const unitPrice = nextItem.unitPrice ?? item.unitPrice;
        const discountAmount = nextItem.discountAmount ?? item.discountAmount;

        return {
          ...item,
          ...nextItem,
          quantity,
          unitPrice,
          discountAmount,
          subtotal: calculateSubtotal(quantity, unitPrice, discountAmount),
        };
      }),
    }));
  },

  clearCart: () => {
    set({ cart: [] });
  },
}));
