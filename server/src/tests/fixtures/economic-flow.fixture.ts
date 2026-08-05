import { createOperationalBusinessFixture } from "@/tests/fixtures/business.fixture.js";
import type { OperationalBusinessFixture } from "@/tests/fixtures/business.fixture.js";
import { createDepositFixture } from "@/tests/fixtures/deposit.fixture.js";
import { createProductCategoryFixture } from "@/tests/fixtures/product-category.fixture.js";
import { createProductFixture } from "@/tests/fixtures/product.fixture.js";
import { createSupplierFixture } from "@/tests/fixtures/supplier.fixture.js";
import { createCustomerFixture } from "@/tests/fixtures/customer.fixture.js";
import { createPaymentMethodFixture } from "@/tests/fixtures/payment-method.fixture.js";
import { ensureStockFixture } from "@/tests/fixtures/stock.fixture.js";

export interface EconomicFlowScenario {
  business: OperationalBusinessFixture;
  product: {
    idProduct: number;
    idProductCategory: number;
    salePrice: number;
    costPrice: number;
  };
  secondProduct: {
    idProduct: number;
    idProductCategory: number;
    salePrice: number;
    costPrice: number;
  };
  sourceDeposit: {
    idDeposit: number;
  };
  destinationDeposit: {
    idDeposit: number;
  };
  supplier: {
    idSupplier: number;
  };
  customer: {
    idCustomer: number;
  };
  cashRegister: {
    idCashRegister: number;
  };
  cashPaymentMethod: {
    idPaymentMethod: number;
  };
  transferPaymentMethod: {
    idPaymentMethod: number;
  };
}

export async function createEconomicFlowScenario(): Promise<EconomicFlowScenario> {
  const business = await createOperationalBusinessFixture("economic");
  const category = await createProductCategoryFixture(
    business.business.idBusiness,
    "Categoria economica",
  );
  const destinationDeposit = await createDepositFixture(
    business.business.idBusiness,
    "Deposito destino",
  );
  const product = await createProductFixture({
    idBusiness: business.business.idBusiness,
    idProductCategory: category.idProductCategory,
    idDeposit: business.defaultDeposit.idDeposit,
    namePrefix: "Producto economico A",
    quantity: 10,
  });
  const secondProduct = await createProductFixture({
    idBusiness: business.business.idBusiness,
    idProductCategory: category.idProductCategory,
    idDeposit: business.defaultDeposit.idDeposit,
    namePrefix: "Producto economico B",
    quantity: 20,
  });

  await ensureStockFixture({
    idBusiness: business.business.idBusiness,
    idProduct: product.idProduct,
    idDeposit: destinationDeposit.idDeposit,
    quantity: 2,
  });

  const supplier = await createSupplierFixture(business.business.idBusiness);
  const customer = await createCustomerFixture(business.business.idBusiness);
  const transferPaymentMethod = await createPaymentMethodFixture(
    business.business.idBusiness,
    "Transferencia economica",
  );

  return {
    business,
    product: {
      idProduct: product.idProduct,
      idProductCategory: category.idProductCategory,
      salePrice: 20,
      costPrice: 10,
    },
    secondProduct: {
      idProduct: secondProduct.idProduct,
      idProductCategory: category.idProductCategory,
      salePrice: 30,
      costPrice: 15,
    },
    sourceDeposit: {
      idDeposit: business.defaultDeposit.idDeposit,
    },
    destinationDeposit: {
      idDeposit: destinationDeposit.idDeposit,
    },
    supplier: {
      idSupplier: supplier.idSupplier,
    },
    customer: {
      idCustomer: customer.idCustomer,
    },
    cashRegister: {
      idCashRegister: business.defaultCashRegister.idCashRegister,
    },
    cashPaymentMethod: {
      idPaymentMethod: business.cashPaymentMethod.idPaymentMethod,
    },
    transferPaymentMethod: {
      idPaymentMethod: transferPaymentMethod.idPaymentMethod,
    },
  };
}
