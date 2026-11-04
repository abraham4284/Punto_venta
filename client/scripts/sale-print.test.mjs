import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { salePrintFixtures } from "./fixtures/sale-print.fixtures.mjs";
const root=fileURLToPath(new URL("../src/",import.meta.url));
const cache=new Map();
// Compile only the print component and its pure dependencies; never the app/API.
const moduleUrl=(path)=>{
 if(cache.has(path))return cache.get(path);
 const code=ts.transpileModule(readFileSync(path,"utf8"),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']([^"']+)["']/g,(_,specifier)=>{
   const next=specifier.startsWith("@/")?moduleUrl(resolve(root,specifier.slice(2))+".ts"):specifier.startsWith(".")?moduleUrl(resolve(path,"..",specifier)+".ts"):import.meta.resolve(specifier);
   return `from ${JSON.stringify(next)}`;
 });
 const url=`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;cache.set(path,url);return url;
};
const componentPath=resolve(root,"views/businesses-app/module/sales/components/print/SalePrintDocument.tsx");
const {SalePrintContent}=await import(moduleUrl(componentPath));
const render=(fixture)=>renderToStaticMarkup(createElement(SalePrintContent,fixture));
const text=(html)=>html.replace(/<style>[\s\S]*?<\/style>/g,"").replace(/<[^>]+>/g," ");
const qaOutput=process.argv.find((arg)=>arg.startsWith("--fixtures="))?.slice(11);
if(qaOutput){
 mkdirSync(qaOutput,{recursive:true});
 const globals=readFileSync(resolve(root,"index.css"),"utf8").split("@media print {")[1];
 for(const [name,fixture] of Object.entries(salePrintFixtures)){
  const markup=render(fixture);
  const html=`<!doctype html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>QA ${name} - SalePrintDocument</title><style>body{margin:0;background:#edf1ef} .qa-preview{max-width:800px;margin:20px auto;background:white}.qa-controls{padding:12px;font:14px Arial}.qa-controls a{margin-right:16px} @media print {${globals}</style></head><body><div id="root"><div class="qa-controls">QA aislada, datos ficticios. ${Object.keys(salePrintFixtures).map((key)=>`<a href="${key}.html">Escenario ${key}</a>`).join("")}<button onclick="window.print()">Imprimir comprobante</button><header>HEADER ADMINISTRATIVO NO IMPRIMIR</header><aside>SIDEBAR NO IMPRIMIR</aside><p>MENSAJE DE SUSCRIPCION NO IMPRIMIR</p></div><div class="qa-preview">${markup}</div></div><div class="sale-print-root">${markup}</div></body></html>`;
  writeFileSync(join(qaOutput,`${name}.html`),html,"utf8");
 }
 console.log(`7 print fixtures generated in ${qaOutput}`);
}else{
 test("compact semantic table with every sale item and decimal quantities",()=>{const html=render(salePrintFixtures.A);assert.equal((html.match(/<tbody>[\s\S]*?<\/tbody>/)?.[0].match(/<tr>/g)||[]).length,3);for(const label of ["Foto","Producto","Cant.","Precio unit.","Total"])assert.ok(html.includes(label));assert.ok(text(html).includes("1,25"));});
 test("tenant branding from existing business data, no hardcoded company",()=>{const fixture=structuredClone(salePrintFixtures.D);fixture.business.name="Otro comercio";assert.ok(text(render(fixture)).includes("Otro comercio"));assert.ok(!text(render(fixture)).includes("VITRUNO"));});
 test("customer optional fields and consumer fallback",()=>{const html=render(salePrintFixtures.D);assert.ok(text(html).includes("Consumidor final"));for(const field of ["Documento:","Teléfono:","Email:","Dirección:"])assert.ok(!text(html).includes(field));});
 test("no empty delivery/notes block for pickup",()=>{const html=render(salePrintFixtures.A);assert.ok(!html.includes('class="sale-print-delivery"'));assert.ok(!html.includes('class="sale-print-notes"'));assert.ok(!text(html).includes("Sin observaciones"));});
 test("delivery preserves recipient/contact/address/reference",()=>{const html=render(salePrintFixtures.B),content=text(html);for(const value of ["Martín Díaz","0381 000-0000","Av. de Prueba 1255","Portón negro"])assert.ok(content.includes(value),value);});
 for(const name of Object.keys(salePrintFixtures))test(`${name}: no internal logistics/deposit/seller data or technical sale enum`,()=>{const content=text(render(salePrintFixtures[name]));for(const value of ["externalCost","9.876.543,21","REFERENCIA_LOGISTICA_PRIVADA","DEPOSITO_INTERNO_NO_PUBLICAR","VENDEDOR_INTERNO_NO_PUBLICAR","THIRD_PARTY","COMPLETED","CANCELLED"])assert.ok(!content.includes(value),value);});
 test("summary shows only subtotal discount and total, with no payment methods or shipping breakdown",()=>{for(const fixture of [salePrintFixtures.B,salePrintFixtures.C]){const html=render(fixture),content=text(html);for(const value of ["Pagos","Efectivo","Transferencia bancaria","Mercado Pago","RESUMEN_LEGACY_NO_DUPLICAR"])assert.ok(!content.includes(value),value);const summary=html.match(/<dl class="sale-print-totals">([\s\S]*?)<\/dl>/)?.[1];assert.ok(summary);assert.deepEqual([...summary.matchAll(/<dt>(.*?)<\/dt>/g)].map(m=>m[1]),["Subtotal","Descuento","TOTAL"]);}});
 test("missing product/logo image has discrete fixed-size fallback",()=>{const html=render(salePrintFixtures.D);assert.ok(html.includes('aria-label="Sin imagen"'));assert.ok(!html.includes('src="null"'));assert.ok(!html.includes('src="undefined"'));});
 test("original totals are displayed without changing inputs",()=>{const fixture=structuredClone(salePrintFixtures.F),before=structuredClone(fixture);const html=render(fixture);for(const value of ["Descuento de línea:","Descuento","Subtotal","TOTAL"])assert.ok(text(html).includes(value));assert.deepEqual(fixture,before);});
 test("cancelled sale keeps readable amounts and explicit status",()=>{const html=render(salePrintFixtures.G);assert.ok(text(html).includes("Cancelada"));assert.ok(text(html).includes("Venta cancelada"));assert.ok(!html.includes("rotate"));});
 test("notes preserve line breaks and escape markup",()=>{const fixture=structuredClone(salePrintFixtures.B);fixture.sale.observation="Primera línea\n<script>NO_SCRIPT</script>";const html=render(fixture);assert.ok(html.includes("Primera línea\n&lt;script&gt;"));assert.ok(!html.includes("<script>"));});
 test("print isolation and pagination are scoped to the Sales portal",()=>{const source=readFileSync(componentPath,"utf8"),html=render(salePrintFixtures.E);assert.ok(source.includes("createPortal"));assert.ok(source.includes("document.body"));assert.ok(html.includes("body:has(&gt; .sale-print-root)")||html.includes("body:has(> .sale-print-root)"));assert.ok(html.includes("table-header-group"));assert.ok(html.includes("page-break-inside: avoid"));assert.ok(!html.includes("min-h-[1120px]"));assert.ok(!html.includes('class="print-container'));});
}
