import { headers } from "next/headers";
import { ConsoleShell } from "@/components/console-shell";
import { requirePageActor } from "@/server/authorization";

export default async function ConsoleLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const actor = await requirePageActor();
  const pathname =
    (await headers()).get("x-invoke-path") ?? (await headers()).get("x-next-url") ?? "/dashboard";
  return (
    <ConsoleShell actor={actor} pathname={pathname}>
      <div className="page-content">{children}</div>
    </ConsoleShell>
  );
}
