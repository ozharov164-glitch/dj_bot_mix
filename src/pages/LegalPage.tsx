import { IconArrowLeft } from "../components/icons";
import { LEGAL_DOCS, type LegalDocId } from "../legal/docs";

type LegalPageProps = {
  docId: LegalDocId;
  onBack: () => void;
};

export function LegalPage({ docId, onBack }: LegalPageProps) {
  const doc = LEGAL_DOCS[docId];

  return (
    <main className="page">
      <header className="page-header">
        <div className="page-header__main">
          <button type="button" className="back-link" onClick={onBack}>
            <span className="back-link__chevron" aria-hidden="true">
              <IconArrowLeft size={16} />
            </span>
            Назад
          </button>
          <h1 className="page-title">{doc.title}</h1>
        </div>
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
