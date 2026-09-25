"use client";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * An inline <script> that only exists in the server HTML. React never runs scripts it creates
 * on the client (and warns about them), which happens when a 404 renders the whole page in the browser.
 */
export function InlineScript({ html }: { html: string }) {
  const fromServer = useSyncExternalStore(subscribe, () => false, () => true);
  return fromServer ? <script dangerouslySetInnerHTML={{ __html: html }} /> : null;
}
