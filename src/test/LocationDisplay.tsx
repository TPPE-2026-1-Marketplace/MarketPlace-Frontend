import { useLocation } from "react-router-dom";

/** Mostra a rota atual para os testes verificarem navegações. */
export function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
}
