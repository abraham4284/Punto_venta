import { useEffect, useState } from "react";
import { Meta } from "@/components/Meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Toaster } from "react-hot-toast";
import { CashRegisterModal } from "../components/CashRegisterModal";
import { useCash } from "../hooks/useCash";
import type { CashRegisterResponse } from "../types";

export const CashRegistersPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [dataEdit, setDataEdit] = useState<CashRegisterResponse | null>(null);
  const { registers, loading, saving, refreshDashboard, createRegister, updateRegister, changeRegisterStatus, setDefaultRegister } = useCash();

  useEffect(() => {
    void refreshDashboard();
  }, [refreshDashboard]);

  const openCreate = () => {
    setDataEdit(null);
    setModalOpen(true);
  };

  return (
    <>
      <Meta title="Configuracion de Cajas" />
      <main className="space-y-6 p-2 md:p-6">
        <section className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Configuracion de cajas</h1>
            <p className="text-muted-foreground">Gestiona cajas fisicas o logicas del negocio.</p>
          </div>
          <Button type="button" onClick={openCreate}>Nueva caja</Button>
        </section>

        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-3 text-left">Caja</th>
                  <th className="p-3 text-left">Descripcion</th>
                  <th className="p-3 text-left">Predeterminada</th>
                  <th className="p-3 text-left">Estado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Cargando cajas...</td></tr>
                ) : registers.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No hay cajas creadas.</td></tr>
                ) : (
                  registers.map((register) => (
                    <tr key={register.idCashRegister} className="border-b">
                      <td className="p-3 font-medium">{register.name}</td>
                      <td className="p-3">{register.description ?? "-"}</td>
                      <td className="p-3">{register.isDefault ? "Si" : "No"}</td>
                      <td className="p-3">{register.isActive ? "Activa" : "Inactiva"}{register.hasOpenSession ? " - abierta" : ""}</td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => { setDataEdit(register); setModalOpen(true); }}>Editar</Button>
                          {!register.isDefault && register.isActive && <Button type="button" variant="outline" size="sm" onClick={() => void setDefaultRegister(register.idCashRegister)}>Predeterminar</Button>}
                          <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => void changeRegisterStatus(register.idCashRegister, !register.isActive)}>
                            {register.isActive ? "Desactivar" : "Activar"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>
      <CashRegisterModal
        isOpen={modalOpen}
        dataEdit={dataEdit}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onCreate={createRegister}
        onUpdate={updateRegister}
      />
      <Toaster position="top-right" reverseOrder={false} />
    </>
  );
};
