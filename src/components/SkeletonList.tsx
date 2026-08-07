/** Premium loading placeholders — avoids blank freezes. */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <ul className="skeleton-list" aria-hidden="true" aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="skeleton-card" style={{ animationDelay: `${i * 60}ms` }}>
          <span className="skeleton-card__mark skeleton-shimmer" />
          <span className="skeleton-card__body">
            <span className="skeleton-card__line skeleton-card__line--title skeleton-shimmer" />
            <span className="skeleton-card__line skeleton-card__line--meta skeleton-shimmer" />
          </span>
        </li>
      ))}
    </ul>
  );
}
