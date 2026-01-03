import { useEffect } from "react";
import { APP_CONFIG } from "../config/appConfig";

export function usePageTitle(pageTitle?: string) {
  useEffect(() => {
    const base = APP_CONFIG.companyName;
    document.title = pageTitle ? `${pageTitle} | ${base}` : base;
  }, [pageTitle]);
}


