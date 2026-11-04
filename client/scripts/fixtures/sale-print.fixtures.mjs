// Fictitious, self-contained fixtures. No API, real customers or external images.
const svg = (content) => `data:image/svg+xml,${encodeURIComponent(content)}`;
const logo = svg('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" rx="16" fill="#167653"/><path d="M24 27L50 75L76 27" stroke="white" stroke-width="12" fill="none"/></svg>');
const photo = svg('<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72"><rect width="72" height="72" rx="6" fill="#f1f4f3"/><rect x="19" y="14" width="34" height="44" rx="7" fill="#475c54"/><circle cx="36" cy="36" r="10" fill="#bfd8cb"/><circle cx="36" cy="36" r="5" fill="#475c54"/></svg>');
const makeFixture = ({count=3,delivery=false,mixed=false,missing=false,discount=false,cancelled=false,long=false}={}) => {
 const items=Array.from({length:count},(_,i)=>({idSaleDetail:i+1,idProduct:i+1,productName:long&&i%4===0?`Producto ${i+1} · Auricular inalámbrico con estuche de carga y accesorios, edición de prueba con nombre extendido`:["Auricular M10 Extratech","Cable USB-C reforzado","Mixor Fusion","Soporte regulable","Parlante portátil"][i%5]+` · ${i+1}`,barcode:`QA-${String(i+1).padStart(3,"0")}`,productImageUrl:missing&&i%2===0?null:photo,quantity:i===1?1.25:3,unitPrice:2000+i*500,discount:discount&&i===0?500:0,total:(i===1?1.25:3)*(2000+i*500)-(discount&&i===0?500:0)}));
 const grossSubtotal=items.reduce((sum,item)=>sum+item.unitPrice*item.quantity,0);
 const discountTotal=discount?500:0,deliveryFee=delivery?5000:0,total=grossSubtotal-discountTotal+deliveryFee;
 const payments=mixed?[{idSalePayment:1,paymentMethodName:"Efectivo",amount:10000,status:"CONFIRMED"},{idSalePayment:2,paymentMethodName:"Transferencia bancaria",amount:total-10000,status:"PENDING"}]:[{idSalePayment:1,paymentMethodName:"Mercado Pago",amount:total,status:cancelled?"CANCELLED":"CONFIRMED"}];
 return {business:{name:"VITRUNO",logoUrl:missing?null:logo,businessType:"TECNOLOGIA"},customer:missing?null:{fullName:"Martín Díaz (cliente ficticio)",documentType:"DNI",documentNumber:"00000000",phone:"0381 000-0000",address:"Calle de Prueba 1255",email:"cliente@example.test"},grossSubtotal,
 sale:{idSale:1,saleNumber:"VTA-QA-000123",saleDate:"2026-11-04T15:30:00.000Z",status:cancelled?"CANCELLED":"COMPLETED",customerName:"Consumidor final",depositName:"DEPOSITO_INTERNO_NO_PUBLICAR",userName:"VENDEDOR_INTERNO_NO_PUBLICAR",subtotal:grossSubtotal,discountTotal,deliveryFee,total,paymentDetail:"RESUMEN_LEGACY_NO_DUPLICAR",paymentMethodName:"Mercado Pago",payments,items,observation:delivery?"Entregar por la tarde. Verificar los productos antes de despachar.\nGracias por coordinar la recepción.":null,delivery:delivery?{status:"ASSIGNED",recipientName:"Martín Díaz (destinatario ficticio)",recipientPhone:"0381 000-0000",deliveryAddress:"Av. de Prueba 1255, departamento 2",deliveryReference:"Portón negro. Llamar al llegar.",providerType:"THIRD_PARTY",externalProviderName:"Proveedor interno QA",externalReference:"REFERENCIA_LOGISTICA_PRIVADA",externalCost:9876543.21}:null}};
};
export const salePrintFixtures={
 A:makeFixture(),
 B:makeFixture({count:5,delivery:true}),
 C:makeFixture({count:6,mixed:true}),
 D:makeFixture({count:4,missing:true}),
 E:makeFixture({count:25,delivery:true,mixed:true,long:true}),
 F:makeFixture({count:10,delivery:true,discount:true}),
 G:makeFixture({count:5,cancelled:true}),
};
