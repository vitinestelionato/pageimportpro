/**
 * Registry loader — importa todos os adapters específicos para que
 * sejam registrados no singleton via `registerConnector`.
 *
 * Novos conectores: adicionar arquivo em `./adapters/<slug>.ts` e
 * importá-lo aqui.
 */
import "./adapters/cssbuy";
import "./adapters/acbuy";

export {}; // side-effect module
