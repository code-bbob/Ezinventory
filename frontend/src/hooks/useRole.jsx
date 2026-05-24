import { useEffect, useState } from "react";
import useAxios from "@/utils/useAxios";

// Simple role fetcher. Exposes role and boolean isAdmin for UI gating.
export default function useRole() {
  const api = useAxios();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get("enterprise/role/");
        if (!active) return;
        setRole(res.data);
      } catch (e) {
        if (!active) return;
        setError(e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const isAdmin = (typeof role === "string" ? role : "")
    .toLowerCase()
    .includes("admin");

  return { role, isAdmin, loading, error };
}
