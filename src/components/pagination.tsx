import Link from "next/link";
export default function Pagination({
  base,
  query,
  page,
  pages,
  total,
}: {
  base: string;
  query: Record<string, string>;
  page: number;
  pages: number;
  total: number;
}) {
  const href = (number: number) => {
    const params = new URLSearchParams(query);
    params.set("page", String(number));
    return `${base}?${params}`;
  };
  return (
    <div className="pagination">
      <span>
        {total} results · Page {page} of {Math.max(1, pages)}
      </span>
      <div>
        {page > 1 && (
          <Link className="button secondary" href={href(page - 1)}>
            Previous
          </Link>
        )}
        {page < pages && (
          <Link className="button secondary" href={href(page + 1)}>
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
