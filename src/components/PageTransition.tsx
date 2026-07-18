import { ReactNode } from "react";
import { useLocation } from "react-router-dom";

const PageTransition = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();

  return (
    <div key={pathname} className="animate-fade-in-up">
      {children}
    </div>
  );
};

export default PageTransition;
