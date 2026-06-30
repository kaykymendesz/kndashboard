"use client";

import dynamic from "next/dynamic";
import { memo } from "react";
import type { ProposalDocumentData } from "@/lib/proposals/types";
import "./proposal-preview.css";

const ProposalDocument = dynamic(
  () => import("./proposal-document").then((m) => m.ProposalDocument),
  {
    loading: () => (
      <div className="kn-proposal-preview-skeleton" aria-hidden>
        Carregando pré-visualização…
      </div>
    ),
  }
);

export const ProposalPreview = memo(function ProposalPreview({
  data,
  layoutJson,
}: {
  data: ProposalDocumentData;
  layoutJson?: string;
}) {
  return (
    <div className="kn-proposal-preview-viewport">
      <div className="kn-proposal-preview-scale">
        <ProposalDocument data={data} layoutJson={layoutJson} />
      </div>
    </div>
  );
});
