"use client";

import { Button } from "./ui/button";

export function ReportsExport() {
  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => window.open("/api/reports/excel", "_blank")}>Excel</Button>
      <Button variant="outline" onClick={() => window.open("/api/reports/pdf", "_blank")}>PDF</Button>
    </div>
  );
}
