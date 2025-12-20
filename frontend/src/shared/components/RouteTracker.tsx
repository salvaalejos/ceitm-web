import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactGA from "react-ga4";

const RouteTracker = () => {
  const location = useLocation();

  // 👇 CORRECCIÓN AQUÍ TAMBIÉN
  const GA = (ReactGA as any).default ?? ReactGA;

  useEffect(() => {
    // Usamos 'GA' en lugar de ReactGA directo
    GA.send({
        hitType: "pageview",
        page: location.pathname + location.search
    });
  }, [location]);

  return null;
};

export default RouteTracker;