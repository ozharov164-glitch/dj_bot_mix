import { StudioSplash } from "../components/StudioSplash";

/** Auth / boot gate — always the marketing studio splash. */
export function LoadingPage({ message }: { message?: string }) {
  return <StudioSplash status={message} />;
}
