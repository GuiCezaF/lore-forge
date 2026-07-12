import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement, ReactNode } from "react";
import ptBRMessages from "../messages/pt-BR.json";

type IntlWrapperProps = {
  children: ReactNode;
};

function IntlWrapper({ children }: IntlWrapperProps) {
  return (
    <NextIntlClientProvider locale="pt-BR" messages={ptBRMessages}>
      {children}
    </NextIntlClientProvider>
  );
}

export function renderWithIntl(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, {
    wrapper: ({ children }) => <IntlWrapper>{children}</IntlWrapper>,
    ...options,
  });
}
