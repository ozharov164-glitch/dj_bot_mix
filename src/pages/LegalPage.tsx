import { LEGAL_DOCS, type LegalDocId } from "../legal/docs";
import { Button } from "../components/Button";

type LegalPageProps = {
  docId: LegalDocId;
  onBack: () => void;
};

export function LegalPage({ docId, onBack }: LegalPageProps) {
  const doc = LEGAL_DOCS[docId];

  return (
    <main className="page">
      <header className="page-header">
        <Button variant="ghost" onClick={onBack}>
          ← Назад
        </Button>
        <h1>{doc.title}</h1>
      </header>

      <section className="panel panel--warning" role="status">
        <strong>{doc.draftBanner}</strong>
      </section>

      {doc.sections.map((section) => (
        <section className="panel" key={section.heading}>
          <h2 className="panel__title">{section.heading}</h2>
          <p className="muted">{section.body}</p>
        </section>
      ))}
    </main>
  );
}
