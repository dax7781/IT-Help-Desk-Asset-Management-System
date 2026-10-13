import { statuses, label } from "@/lib/constants";
export default function TicketStage({ status }: { status: string }) {
  return (
    <ol className="ticket-stage" aria-label="Ticket workflow stages">
      {statuses.map((stage, index) => (
        <li key={stage} aria-current={stage === status ? "step" : undefined}>
          <span aria-hidden="true">{index + 1}</span>
          {label(stage)}
          {stage === status && <span className="sr-only">, current stage</span>}
        </li>
      ))}
    </ol>
  );
}
