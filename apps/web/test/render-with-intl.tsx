import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement, ReactNode } from "react";
import ptBRMessages from "../messages/pt-BR.json";
import enMessages from "../messages/en.json";
import type { Locale } from "../i18n/routing";

const messagesByLocale = {
  "pt-BR": ptBRMessages,
  en: enMessages,
} as const;

type IntlWrapperProps = {
  children: ReactNode;
  locale?: Locale;
};

function IntlWrapper({ children, locale = "pt-BR" }: IntlWrapperProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messagesByLocale[locale]}>
      {children}
    </NextIntlClientProvider>
  );
}

export function renderWithIntl(
  ui: ReactElement,
  locale: Locale = "pt-BR",
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <IntlWrapper locale={locale}>{children}</IntlWrapper>
    ),
    ...options,
  });
}
