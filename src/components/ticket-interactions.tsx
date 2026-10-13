"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
type Interaction = {
  pending: boolean;
  begin: () => boolean;
  complete: (refresh: boolean) => void;
};
const Context = createContext<Interaction | null>(null);
export function useTicketInteraction() {
  return useContext(Context);
}
export default function TicketInteractions({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const locked = useRef(false);
  useEffect(() => {
    if (!saving && !refreshing) locked.current = false;
  }, [saving, refreshing]);
  function begin() {
    if (locked.current) return false;
    locked.current = true;
    setSaving(true);
    return true;
  }
  function complete(refresh: boolean) {
    if (refresh)
      startTransition(() => {
        router.refresh();
        setSaving(false);
      });
    else setSaving(false);
  }
  return (
    <Context.Provider
      value={{ pending: saving || refreshing, begin, complete }}
    >
      {children}
    </Context.Provider>
  );
}
