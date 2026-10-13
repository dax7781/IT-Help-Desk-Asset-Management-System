import { label } from "@/lib/constants";
export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={"status-badge status-" + status.toLowerCase()}>
      <i />
      {label(status)}
    </span>
  );
}
