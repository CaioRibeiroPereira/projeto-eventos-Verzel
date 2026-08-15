import { RoleGate } from "@/components/role-gate";

export default function ClientePage() {
  return <RoleGate role="customer" label="Meus ingressos" />;
}
