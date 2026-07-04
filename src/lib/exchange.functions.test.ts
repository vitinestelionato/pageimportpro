import { describe, it, expect } from "vitest";
import { parseGoogleFinanceQuote, SUPPORTED_CURRENCIES } from "./exchange.functions";

describe("parseGoogleFinanceQuote", () => {
  it("extrai preço via data-last-price", () => {
    const html = `<div data-last-price="5.4231" data-currency="BRL">R$5,42</div>`;
    const r = parseGoogleFinanceQuote(html, "USD");
    expect(r.value).toBe(5.4231);
    expect(r.strategy).toBe("data-last-price");
  });

  it("extrai preço via AF_initDataCallback(ds:3)", () => {
    const html = `garbage AF_initDataCallback({key: 'ds:3', hash: 'x', data:[["USD","BRL",5.4123,1234567,0.02,"regular",null,null,5.42,5.40,5.45,5.38]], sideChannel: {}});`;
    const r = parseGoogleFinanceQuote(html, "USD");
    expect(r.value).toBe(5.4123);
    expect(r.strategy).toBe("af_init_ds3");
  });

  it("ignora valores fora da faixa plausível (protege contra 52w high)", () => {
    // Valor 12345.67 seria pego pelo primeiro regex mas está fora da faixa (3.5-10 para USD)
    const html = `<span data-last-price="12345.67">bogus</span>`;
    const r = parseGoogleFinanceQuote(html, "USD");
    expect(r.value).toBeNull();
    expect(r.attempts[0].reason).toContain("fora_da_faixa");
  });

  it("cai para regularMarketPrice quando primeiros padrões falham", () => {
    const html = `noise {"regularMarketPrice":5.4567,"other":1} more noise`;
    const r = parseGoogleFinanceQuote(html, "USD");
    expect(r.value).toBe(5.4567);
    expect(r.strategy).toBe("regularMarketPrice");
  });

  it("cai para visible-pair (1 USD = X BRL)", () => {
    const html = `<p>1 USD = 5.4321 BRL</p>`;
    const r = parseGoogleFinanceQuote(html, "USD");
    expect(r.value).toBe(5.4321);
    expect(r.strategy).toBe("visible-pair");
  });

  it("retorna null e registra todas as tentativas quando não encontra nada", () => {
    const html = `<html><body>página quebrada sem dados</body></html>`;
    const r = parseGoogleFinanceQuote(html, "USD");
    expect(r.value).toBeNull();
    expect(r.strategy).toBeNull();
    expect(r.attempts.length).toBeGreaterThanOrEqual(3);
    expect(r.attempts.every((a) => !a.matched)).toBe(true);
  });

  it("valida faixa para CNY (0.4 - 2.5)", () => {
    const valido = parseGoogleFinanceQuote(`<span data-last-price="0.7615">x</span>`, "CNY");
    expect(valido.value).toBe(0.7615);

    const invalido = parseGoogleFinanceQuote(`<span data-last-price="15.0">x</span>`, "CNY");
    expect(invalido.value).toBeNull();
  });

  it("valida faixa para JPY (0.02 - 0.1)", () => {
    const r = parseGoogleFinanceQuote(`<span data-last-price="0.035">x</span>`, "JPY");
    expect(r.value).toBe(0.035);
  });

  it("prefere o primeiro número plausível dentro do bloco ds:3", () => {
    // primeiro número (999.99) está fora da faixa, deve pegar o segundo
    const html = `key:'ds:3', data:[[999.99, 5.4231, 100, 200]], sideChannel:{}`;
    const r = parseGoogleFinanceQuote(html, "USD");
    expect(r.value).toBe(5.4231);
  });

  it("todas as moedas suportadas têm faixa de sanidade", () => {
    for (const c of SUPPORTED_CURRENCIES) {
      const r = parseGoogleFinanceQuote(`<x data-last-price="${999999}">`, c);
      // Deve rejeitar 999999 em todas
      expect(r.value).toBeNull();
    }
  });

  it("estratégias são tentadas em ordem", () => {
    // apenas visible-pair casa
    const html = `<p>1 EUR = 5.90 BRL</p>`;
    const r = parseGoogleFinanceQuote(html, "EUR");
    expect(r.attempts.length).toBe(5);
    expect(r.attempts[0].strategy).toBe("data-last-price");
    expect(r.attempts[4].strategy).toBe("visible-pair");
    expect(r.strategy).toBe("visible-pair");
  });
});
