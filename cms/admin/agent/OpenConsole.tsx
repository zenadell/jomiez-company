import Link from "next/link";

/* Above the Conversations list: the console is where conversations are read and continued. */
export function OpenConsole() {
  return (
    <div className="jz-open-console">
      <span>Read, continue or undo any conversation in the console.</span>
      <Link className="jz-btn jz-btn--yes" href="/admin/agent">
        Open the agent console
      </Link>
    </div>
  );
}
