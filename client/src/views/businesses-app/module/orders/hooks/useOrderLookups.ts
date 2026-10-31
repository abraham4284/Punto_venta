import { useEffect, useState } from "react";
import { useCustomers } from "../../customers/hooks/useCustomers";
import { useDeposits } from "../../deposits/hooks/useDeposits";
import { usePaymentMethods } from "../../payment-methods/hooks/usePaymentMethods";

export const useOrderLookups = (includeCustomers = false) => {
  const { customers, getCustomers } = useCustomers();
  const { deposits, getDeposits, error: depositError } = useDeposits();
  const { paymentMethods, getPaymentMethods, error: paymentError } = usePaymentMethods();
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      await Promise.allSettled([getDeposits(), getPaymentMethods(), ...(includeCustomers ? [getCustomers().then(() => { if (active) setCustomerError(null); }).catch(() => { if (active) setCustomerError("No se pudieron cargar los clientes. Revisá el permiso de lectura de Clientes."); })] : [])]);
      if (active) setLoading(false);
    };
    void load(); return () => { active = false; };
  }, [getCustomers, getDeposits, getPaymentMethods, includeCustomers, revision]);
  return { customers, deposits, paymentMethods, loading, reload: () => setRevision((n) => n + 1),
    error: [customerError, depositError, paymentError].filter(Boolean).join(" ") };
};
